import base64

import pytest
from fastapi.testclient import TestClient

from app import main
from app.ai.email_intelligence.schemas import EmailAnalysis, EmailInput
from app.email_integration.gmail import GmailProvider
from app.email_integration.store import EmailStore


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(main, "email_store", EmailStore())
    return TestClient(main.app)


class FakeGmailProvider:
    def __init__(self, emails=None):
        self.emails = emails or []
        self.sent = []

    def fetch_emails(self, limit):
        return self.emails[:limit]

    def send_email(self, recipient, subject, body):
        self.sent.append((recipient, subject, body))
        return "sent-message-1"


def test_manual_email_create_and_get(client):
    response = client.post(
        "/emails",
        json={
            "email_id": "manual-1",
            "sender": "sender@example.com",
            "receiver": "support@example.com",
            "subject": "Help",
            "body": "I need help.",
            "date": "2026-10-11",
            "is_read": True,
        },
    )

    assert response.status_code == 201
    assert response.json()["is_read"] is True
    assert client.get("/emails/manual-1").json()["subject"] == "Help"
    assert client.get("/emails").json()[0]["email_id"] == "manual-1"


def test_import_eml_upload(client):
    response = client.post(
        "/emails/import",
        files={
            "file": (
                "customer.eml",
                "From: customer@example.com\r\n"
                "To: support@example.com\r\n"
                "Subject: Order help\r\n"
                "Date: Sun, 11 Oct 2026 10:00:00 +0000\r\n"
                "Message-ID: <eml-1@example.com>\r\n"
                "Content-Type: text/plain; charset=utf-8\r\n\r\n"
                "I need help with my order.",
                "message/rfc822",
            )
        },
    )

    assert response.status_code == 201
    assert response.json()["count"] == 1
    assert response.json()["emails"][0]["email_id"] == "<eml-1@example.com>"
    assert response.json()["emails"][0]["body"] == "I need help with my order."


def test_import_csv_and_json(client):
    csv_response = client.post(
        "/emails/import",
        files={
            "file": (
                "emails.csv",
                "email_id,sender,receiver,subject,body,date\n"
                "csv-1,a@example.com,b@example.com,CSV,CSV body,2026-10-11\n",
                "text/csv",
            )
        },
    )
    json_response = client.post(
        "/emails/import",
        files={
            "file": (
                "emails.json",
                '[{"email_id":"json-1","sender":"a@example.com",'
                '"receiver":"b@example.com","subject":"JSON",'
                '"body":"JSON body","date":"2026-10-11"}]',
                "application/json",
            )
        },
    )

    assert csv_response.status_code == 201
    assert csv_response.json()["emails"][0]["email_id"] == "csv-1"
    assert json_response.status_code == 201
    assert json_response.json()["emails"][0]["email_id"] == "json-1"


def test_paste_email(client):
    response = client.post(
        "/emails/paste",
        json={
            "raw_email": (
                "From: customer@example.com\n"
                "To: support@example.com\n"
                "Subject: Pasted message\n"
                "Message-ID: <paste-1@example.com>\n\n"
                "This email was pasted."
            )
        },
    )

    assert response.status_code == 201
    assert response.json()["subject"] == "Pasted message"
    assert response.json()["body"].strip() == "This email was pasted."


def test_sync_saves_provider_emails(client, monkeypatch):
    provider = FakeGmailProvider(
        [
            EmailInput(
                email_id="gmail-1",
                sender="customer@example.com",
                receiver="support@example.com",
                subject="Question",
                body="Can you help?",
                date="2026-10-11",
            )
        ]
    )
    monkeypatch.setattr(main, "get_email_provider", lambda: provider)

    response = client.post("/emails/sync", json={"limit": 10})

    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert client.get("/emails/gmail-1").json()["sender"] == "customer@example.com"


def test_send_requires_approval_and_sends_approved_message(client, monkeypatch):
    provider = FakeGmailProvider()
    monkeypatch.setattr(main, "get_email_provider", lambda: provider)
    message = {
        "recipient": "customer@example.com",
        "subject": "Re: Question",
        "body": "Thanks for reaching out.",
    }

    rejected = client.post("/emails/send", json=message)
    sent = client.post("/emails/send", json={**message, "approved": True})

    assert rejected.status_code == 400
    assert provider.sent == [
        ("customer@example.com", "Re: Question", "Thanks for reaching out.")
    ]
    assert sent.status_code == 200
    assert sent.json() == {"message_id": "sent-message-1", "status": "sent"}


def test_analyze_routes_email_through_ai_pipeline(client, monkeypatch):
    client.post(
        "/emails",
        json={
            "email_id": "analyze-1",
            "sender": "customer@example.com",
            "receiver": "support@example.com",
            "subject": "Question",
            "body": "Can you help?",
            "date": "2026-10-11",
        },
    )
    expected = EmailAnalysis(
        category="Support Request",
        intent="Request assistance.",
        priority="Low",
        priority_reason="No urgency stated.",
        sentiment="Neutral",
        sentiment_confidence=0.8,
        reply_required=True,
        summary="The sender asks for help.",
    )
    monkeypatch.setattr(main, "run_email_analysis", lambda email: expected)

    response = client.post("/emails/analyze-1/analyze")

    assert response.status_code == 200
    assert response.json()["analysis"]["category"] == "Support Request"
    assert client.get("/emails/analyze-1").json()["analysis"]["summary"] == (
        "The sender asks for help."
    )


def test_gmail_parser_decodes_headers_and_plain_body():
    body = base64.urlsafe_b64encode(b"Please help with my order.").decode("ascii")
    parsed = GmailProvider._email_from_message(
        {
            "id": "gmail-2",
            "payload": {
                "headers": [
                    {"name": "From", "value": "Customer <customer@example.com>"},
                    {"name": "To", "value": "support@example.com"},
                    {"name": "Subject", "value": "Order question"},
                    {"name": "Date", "value": "Sun, 11 Oct 2026 10:00:00 +0000"},
                ],
                "mimeType": "multipart/alternative",
                "parts": [
                    {
                        "mimeType": "text/plain",
                        "body": {"data": body},
                    }
                ],
            },
        }
    )

    assert parsed.email_id == "gmail-2"
    assert parsed.sender == "Customer <customer@example.com>"
    assert parsed.subject == "Order question"
    assert parsed.body == "Please help with my order."
