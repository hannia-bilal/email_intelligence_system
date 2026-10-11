import csv
import io
import json
from email import message_from_bytes
from email.message import Message
from email.policy import default
from html.parser import HTMLParser
from uuid import uuid4

from pydantic import ValidationError

from ..ai.email_intelligence.schemas import EmailInput

MAX_IMPORT_BYTES = 5 * 1024 * 1024
EMAIL_FIELDS = set(EmailInput.model_fields)


class EmailImportError(ValueError):
    """Raised when an uploaded email file cannot be parsed."""


class _HtmlText(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def parse_eml(content: bytes) -> EmailInput:
    try:
        message = message_from_bytes(content, policy=default)
        body = _message_body(message)
        return EmailInput(
            email_id=str(message.get("Message-ID") or uuid4()),
            sender=str(message.get("From") or ""),
            receiver=str(message.get("To") or ""),
            subject=str(message.get("Subject") or ""),
            body=body,
            date=str(message.get("Date") or ""),
        )
    except (TypeError, ValueError) as exc:
        raise EmailImportError("The .eml file could not be parsed.") from exc


def parse_csv(content: bytes) -> list[EmailInput]:
    try:
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        if reader.fieldnames is None or not EMAIL_FIELDS.issubset(reader.fieldnames):
            raise EmailImportError(
                "CSV must include email_id, sender, receiver, subject, body, and date columns."
            )
        emails = [
            EmailInput.model_validate(
                {field: row.get(field) for field in EMAIL_FIELDS}
            )
            for row in reader
        ]
    except UnicodeDecodeError as exc:
        raise EmailImportError("CSV files must use UTF-8 encoding.") from exc
    except (csv.Error, ValidationError) as exc:
        raise EmailImportError("CSV contains an invalid email record.") from exc
    if not emails:
        raise EmailImportError("CSV contains no email records.")
    return emails


def parse_json(content: bytes) -> list[EmailInput]:
    try:
        payload = json.loads(content.decode("utf-8-sig"))
        if isinstance(payload, dict):
            payload = payload.get("emails")
        if not isinstance(payload, list) or not payload:
            raise EmailImportError(
                "JSON must contain a non-empty list of emails or an 'emails' list."
            )
        return [EmailInput.model_validate(email) for email in payload]
    except UnicodeDecodeError as exc:
        raise EmailImportError("JSON files must use UTF-8 encoding.") from exc
    except (json.JSONDecodeError, ValidationError, TypeError) as exc:
        raise EmailImportError("JSON contains an invalid email record.") from exc


def _message_body(message: Message) -> str:
    plain_text = []
    html_text = []
    for part in message.walk():
        if part.is_multipart() or part.get_content_disposition() == "attachment":
            continue
        content_type = part.get_content_type()
        if content_type not in {"text/plain", "text/html"}:
            continue
        try:
            content = part.get_content()
        except (LookupError, UnicodeDecodeError):
            payload = part.get_payload(decode=True)
            if payload is None:
                continue
            content = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        if not isinstance(content, str):
            continue
        if content_type == "text/plain":
            plain_text.append(content)
        else:
            extractor = _HtmlText()
            extractor.feed(content)
            html_text.append("".join(extractor.parts).strip())
    return "\n".join(plain_text or html_text)
