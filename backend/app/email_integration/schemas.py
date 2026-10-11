from pydantic import BaseModel, Field

from ..ai.email_intelligence.schemas import EmailAnalysis, EmailInput


class EmailRecord(EmailInput):
    is_read: bool = False
    analysis: EmailAnalysis | None = None


class EmailSyncRequest(BaseModel):
    limit: int = Field(default=25, ge=1, le=100)


class EmailSyncResponse(BaseModel):
    count: int
    emails: list[EmailRecord]


class EmailImportResponse(BaseModel):
    count: int
    emails: list[EmailRecord]


class ParseEmailRequest(BaseModel):
    raw_email: str = Field(min_length=1, max_length=5 * 1024 * 1024)


class SendEmailRequest(BaseModel):
    recipient: str
    subject: str
    body: str
    approved: bool = False


class SendEmailResponse(BaseModel):
    message_id: str
    status: str = "sent"


class AuthorizationUrlResponse(BaseModel):
    authorization_url: str
