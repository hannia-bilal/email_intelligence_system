from threading import RLock

from ..ai.email_intelligence.schemas import EmailAnalysis, EmailInput
from .schemas import EmailRecord


class EmailStore:
    def __init__(self) -> None:
        self._emails: dict[str, EmailRecord] = {}
        self._lock = RLock()

    def list(self) -> list[EmailRecord]:
        with self._lock:
            return list(self._emails.values())

    def get(self, email_id: str) -> EmailRecord | None:
        with self._lock:
            return self._emails.get(email_id)

    def save(self, email: EmailInput, *, is_read: bool = False) -> EmailRecord:
        with self._lock:
            existing = self._emails.get(email.email_id)
            record = EmailRecord(
                **email.model_dump(include=set(EmailInput.model_fields)),
                is_read=existing.is_read if existing else is_read,
                analysis=existing.analysis if existing else None,
            )
            self._emails[email.email_id] = record
            return record

    def save_analysis(self, email_id: str, analysis: EmailAnalysis) -> EmailRecord:
        with self._lock:
            record = self._emails[email_id].model_copy(update={"analysis": analysis})
            self._emails[email_id] = record
            return record
