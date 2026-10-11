import base64
import binascii
import os
import secrets
import time
from email.header import decode_header
from email.message import EmailMessage
from html.parser import HTMLParser
from pathlib import Path
from threading import Lock
from typing import Protocol

from ..ai.email_intelligence.schemas import EmailInput

GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
]


class GmailIntegrationError(Exception):
    """Base error for Gmail configuration, authorization, and API failures."""


class GmailConfigurationError(GmailIntegrationError):
    """Raised when Gmail OAuth is not configured correctly."""


class GmailAuthorizationRequired(GmailIntegrationError):
    """Raised when the user has not authorized the configured Gmail account."""


class GmailRequestError(GmailIntegrationError):
    """Raised when the Gmail API rejects or fails a request."""


class EmailProvider(Protocol):
    def fetch_emails(self, limit: int) -> list[EmailInput]: ...

    def send_email(self, recipient: str, subject: str, body: str) -> str: ...


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text: list[str] = []

    def handle_data(self, data: str) -> None:
        self.text.append(data)


class GmailProvider:
    def __init__(self) -> None:
        backend_dir = Path(__file__).resolve().parents[2]
        self.client_secrets_file = Path(
            os.getenv(
                "GOOGLE_CLIENT_SECRETS_FILE",
                str(backend_dir / "client_secret.json"),
            )
        )
        self.token_file = Path(
            os.getenv("GOOGLE_TOKEN_FILE", str(backend_dir / ".gmail_token.json"))
        )
        self.redirect_uri = os.getenv(
            "GOOGLE_REDIRECT_URI",
            "http://localhost:8000/auth/google/callback",
        )
        self._authorization_states: dict[str, float] = {}
        self._state_lock = Lock()

    def authorization_url(self) -> str:
        flow = self._new_flow()
        state = secrets.token_urlsafe(32)
        flow.redirect_uri = self.redirect_uri
        authorization_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=state,
        )
        with self._state_lock:
            self._discard_expired_states()
            self._authorization_states[state] = time.monotonic() + 600
        return authorization_url

    def complete_authorization(self, code: str, state: str) -> None:
        with self._state_lock:
            expires_at = self._authorization_states.pop(state, None)
        if expires_at is None or expires_at < time.monotonic():
            raise GmailAuthorizationRequired(
                "OAuth state is invalid or expired. Start authorization again."
            )

        flow = self._new_flow()
        flow.redirect_uri = self.redirect_uri
        try:
            flow.fetch_token(code=code)
        except ValueError as exc:
            raise GmailRequestError("Google OAuth token exchange failed.") from exc
        self._save_credentials(flow.credentials)

    def fetch_emails(self, limit: int) -> list[EmailInput]:
        service = self._gmail_service()
        try:
            response = (
                service.users()
                .messages()
                .list(userId="me", maxResults=limit)
                .execute()
            )
            messages = response.get("messages", [])
            emails = []
            for message in messages:
                details = (
                    service.users()
                    .messages()
                    .get(userId="me", id=message["id"], format="full")
                    .execute()
                )
                emails.append(self._email_from_message(details))
            return emails
        except self._http_error_type() as exc:
            raise GmailRequestError("Gmail could not fetch the requested messages.") from exc
        except (KeyError, TypeError, ValueError, binascii.Error) as exc:
            raise GmailRequestError("Gmail returned a malformed message.") from exc

    def send_email(self, recipient: str, subject: str, body: str) -> str:
        service = self._gmail_service()
        message = EmailMessage()
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(body)
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")

        try:
            response = (
                service.users()
                .messages()
                .send(userId="me", body={"raw": raw_message})
                .execute()
            )
        except self._http_error_type() as exc:
            raise GmailRequestError("Gmail could not send the message.") from exc
        try:
            return response["id"]
        except (KeyError, TypeError) as exc:
            raise GmailRequestError("Gmail returned no sent message identifier.") from exc

    def _gmail_service(self):
        credentials = self._load_credentials()
        if credentials is None:
            raise GmailAuthorizationRequired(
                "Authorize a Gmail account at GET /auth/google/url before syncing or sending."
            )

        try:
            from google.auth.exceptions import GoogleAuthError
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
        except ImportError as exc:
            raise GmailConfigurationError(
                "Install the Google API dependencies listed in backend/requirements.txt."
            ) from exc

        if not credentials.has_scopes(GMAIL_SCOPES):
            raise GmailAuthorizationRequired(
                "Reauthorize Gmail to grant read and send permissions."
            )
        if credentials.expired:
            if not credentials.refresh_token:
                raise GmailAuthorizationRequired(
                    "Gmail authorization expired. Start authorization again."
                )
            try:
                credentials.refresh(Request())
            except GoogleAuthError as exc:
                raise GmailAuthorizationRequired(
                    "Gmail authorization expired. Start authorization again."
                ) from exc
            self._save_credentials(credentials)

        return build("gmail", "v1", credentials=credentials, cache_discovery=False)

    def _load_credentials(self):
        if not self.token_file.is_file():
            return None

        try:
            from google.oauth2.credentials import Credentials
        except ImportError as exc:
            raise GmailConfigurationError(
                "Install the Google API dependencies listed in backend/requirements.txt."
            ) from exc

        try:
            return Credentials.from_authorized_user_file(
                str(self.token_file),
                scopes=GMAIL_SCOPES,
            )
        except (OSError, ValueError) as exc:
            raise GmailConfigurationError(
                "The Gmail token file is unreadable. Reauthorize Gmail."
            ) from exc

    def _save_credentials(self, credentials) -> None:
        try:
            self.token_file.parent.mkdir(parents=True, exist_ok=True)
            self.token_file.write_text(credentials.to_json(), encoding="utf-8")
        except OSError as exc:
            raise GmailConfigurationError(
                "Could not securely save Gmail authorization. Check the token file path."
            ) from exc

    def _new_flow(self):
        if not self.client_secrets_file.is_file():
            raise GmailConfigurationError(
                "Set GOOGLE_CLIENT_SECRETS_FILE to your Google OAuth client JSON file."
            )
        try:
            from google_auth_oauthlib.flow import Flow

            return Flow.from_client_secrets_file(
                str(self.client_secrets_file),
                scopes=GMAIL_SCOPES,
            )
        except ImportError as exc:
            raise GmailConfigurationError(
                "Install the Google API dependencies listed in backend/requirements.txt."
            ) from exc
        except (OSError, ValueError) as exc:
            raise GmailConfigurationError(
                "The Google OAuth client JSON file is invalid or unreadable."
            ) from exc

    def _http_error_type(self):
        try:
            from googleapiclient.errors import HttpError
        except ImportError as exc:
            raise GmailConfigurationError(
                "Install the Google API dependencies listed in backend/requirements.txt."
            ) from exc
        return HttpError

    def _discard_expired_states(self) -> None:
        now = time.monotonic()
        self._authorization_states = {
            state: expiry
            for state, expiry in self._authorization_states.items()
            if expiry >= now
        }

    @classmethod
    def _email_from_message(cls, message: dict) -> EmailInput:
        payload = message.get("payload", {})
        headers = {
            header.get("name", "").lower(): cls._decode_header(header.get("value", ""))
            for header in payload.get("headers", [])
        }
        body = cls._extract_body(payload)
        date = headers.get("date", "")
        if not date and message.get("internalDate"):
            date = time.strftime(
                "%Y-%m-%dT%H:%M:%SZ",
                time.gmtime(int(message["internalDate"]) / 1000),
            )
        return EmailInput(
            email_id=message["id"],
            sender=headers.get("from", ""),
            receiver=headers.get("to", ""),
            subject=headers.get("subject", ""),
            body=body,
            date=date,
        )

    @staticmethod
    def _decode_header(value: str) -> str:
        decoded = []
        for part, charset in decode_header(value):
            if isinstance(part, bytes):
                decoded.append(part.decode(charset or "utf-8", errors="replace"))
            else:
                decoded.append(part)
        return "".join(decoded)

    @classmethod
    def _extract_body(cls, payload: dict) -> str:
        candidates: list[tuple[str, str]] = []

        def visit(part: dict) -> None:
            mime_type = part.get("mimeType", "")
            body_data = part.get("body", {}).get("data")
            if body_data:
                content = base64.urlsafe_b64decode(body_data).decode(
                    "utf-8", errors="replace"
                )
                if mime_type in ("text/plain", "text/html"):
                    candidates.append((mime_type, content))
            for child in part.get("parts", []):
                visit(child)

        visit(payload)
        for mime_type, content in candidates:
            if mime_type == "text/plain":
                return content
        for mime_type, content in candidates:
            if mime_type == "text/html":
                extractor = _TextExtractor()
                extractor.feed(content)
                return "".join(extractor.text).strip()
        return ""
