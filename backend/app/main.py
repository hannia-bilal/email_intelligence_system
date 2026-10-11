from fastapi import FastAPI, File, HTTPException, Query, UploadFile

from .ai.email_intelligence.schemas import EmailAnalysis
from .email_integration.gmail import (
    GmailAuthorizationRequired,
    GmailConfigurationError,
    GmailIntegrationError,
    GmailProvider,
)
from .email_integration.importers import (
    MAX_IMPORT_BYTES,
    EmailImportError,
    parse_csv,
    parse_eml,
    parse_json,
)
from .email_integration.schemas import (
    AuthorizationUrlResponse,
    EmailImportResponse,
    EmailRecord,
    EmailSyncRequest,
    EmailSyncResponse,
    ParseEmailRequest,
    SendEmailRequest,
    SendEmailResponse,
)
from .email_integration.store import EmailStore

app = FastAPI(
    title="Email Intelligence System API",
    description="Gmail integration and email intelligence endpoints.",
    version="1.0.0",
)
email_store = EmailStore()
email_provider = GmailProvider()


def get_email_provider() -> GmailProvider:
    return email_provider


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/auth/google/url", response_model=AuthorizationUrlResponse)
def google_authorization_url() -> AuthorizationUrlResponse:
    provider = get_email_provider()
    try:
        return AuthorizationUrlResponse(authorization_url=provider.authorization_url())
    except GmailConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/auth/google/callback")
def google_authorization_callback(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
) -> dict[str, str]:
    if error:
        raise HTTPException(status_code=400, detail="Google authorization was denied.")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Google authorization is incomplete.")

    provider = get_email_provider()
    try:
        provider.complete_authorization(code, state)
    except GmailAuthorizationRequired as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GmailIntegrationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"status": "connected"}


@app.get("/emails", response_model=list[EmailRecord])
def list_emails() -> list[EmailRecord]:
    return email_store.list()


@app.post("/emails", response_model=EmailRecord, status_code=201)
def create_email(email: EmailRecord) -> EmailRecord:
    return email_store.save(email, is_read=email.is_read)


@app.post("/emails/import", response_model=EmailImportResponse, status_code=201)
async def import_emails(file: UploadFile = File(...)) -> EmailImportResponse:
    filename = (file.filename or "").lower()
    extension = filename.rsplit(".", 1)[-1] if "." in filename else ""
    parsers = {"eml": lambda content: [parse_eml(content)], "csv": parse_csv, "json": parse_json}
    parser = parsers.get(extension)
    if parser is None:
        raise HTTPException(
            status_code=415,
            detail="Supported email import formats are .eml, .csv, and .json.",
        )

    content = await file.read(MAX_IMPORT_BYTES + 1)
    if len(content) > MAX_IMPORT_BYTES:
        raise HTTPException(status_code=413, detail="Email import files must be 5 MB or smaller.")
    try:
        imported_emails = parser(content)
    except EmailImportError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    emails = [email_store.save(email) for email in imported_emails]
    return EmailImportResponse(count=len(emails), emails=emails)


@app.post("/emails/paste", response_model=EmailRecord, status_code=201)
def paste_email(request: ParseEmailRequest) -> EmailRecord:
    try:
        email = parse_eml(request.raw_email.encode("utf-8"))
    except EmailImportError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return email_store.save(email)


@app.get("/emails/{email_id}", response_model=EmailRecord)
def get_email(email_id: str) -> EmailRecord:
    email = email_store.get(email_id)
    if email is None:
        raise HTTPException(status_code=404, detail="Email not found.")
    return email


@app.post("/emails/sync", response_model=EmailSyncResponse)
def sync_emails(request: EmailSyncRequest) -> EmailSyncResponse:
    provider = get_email_provider()
    try:
        fetched_emails = provider.fetch_emails(request.limit)
    except GmailAuthorizationRequired as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except GmailConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except GmailIntegrationError as exc:
        raise HTTPException(status_code=502, detail="Gmail could not fetch emails.") from exc

    emails = [email_store.save(email) for email in fetched_emails]
    return EmailSyncResponse(count=len(emails), emails=emails)


@app.post("/emails/{email_id}/analyze", response_model=EmailRecord)
def analyze_email(email_id: str) -> EmailRecord:
    email = email_store.get(email_id)
    if email is None:
        raise HTTPException(status_code=404, detail="Email not found.")

    try:
        analysis = run_email_analysis(email)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail="Email analysis failed.") from exc
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="Install the AI dependencies listed in backend/requirements.txt.",
        ) from exc
    return email_store.save_analysis(email_id, analysis)


def run_email_analysis(email: EmailRecord) -> EmailAnalysis:
    from .ai.email_intelligence.pipeline import EmailIntelligencePipeline

    return EmailIntelligencePipeline().analyze_email(email)


@app.post("/emails/send", response_model=SendEmailResponse)
def send_email(request: SendEmailRequest) -> SendEmailResponse:
    if not request.approved:
        raise HTTPException(
            status_code=400,
            detail="Explicit approval is required before sending an email.",
        )

    provider = get_email_provider()
    try:
        message_id = provider.send_email(
            recipient=request.recipient,
            subject=request.subject,
            body=request.body,
        )
    except GmailAuthorizationRequired as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except GmailConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except GmailIntegrationError as exc:
        raise HTTPException(status_code=502, detail="Gmail could not send the email.") from exc
    return SendEmailResponse(message_id=message_id)
