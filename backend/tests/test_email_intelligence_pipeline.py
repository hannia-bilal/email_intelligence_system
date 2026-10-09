
from app.ai.email_intelligence.pipeline import EmailIntelligencePipeline
from app.ai.email_intelligence.schemas import EmailInput, EmailAnalysis


class FakeGeminiProvider:
    """Simulates Gemini without making an API request."""

    def __init__(self):
        self.received_prompt = None

    def analyze_email(self, prompt: str) -> EmailAnalysis:
        self.received_prompt = prompt

        return EmailAnalysis(
            category="Customer Complaint",
            intent="Report an incorrect product and request a replacement.",
            priority="Medium",
            priority_reason="The issue needs attention but is not an emergency.",
            sentiment="Negative",
            sentiment_confidence=0.90,
            reply_required=True,
            summary="The customer received the wrong product and requests a replacement.",
        )


def test_analyze_email_builds_prompt_and_returns_analysis(monkeypatch):
    fake_provider = FakeGeminiProvider()

    monkeypatch.setattr(
        "app.ai.email_intelligence.pipeline.GeminiProvider",
        lambda: fake_provider,
    )

    pipeline = EmailIntelligencePipeline()

    email = EmailInput(
        email_id="TEST-001",
        sender="customer@example.com",
        receiver="support@example.com",
        subject="Incorrect product received",
        body="I ordered a keyboard but received a mouse. Please replace it.",
        date="2026-10-09",
    )

    result = pipeline.analyze_email(email)

    assert isinstance(result, EmailAnalysis)
    assert result.category == "Customer Complaint"
    assert result.priority == "Medium"
    assert result.sentiment == "Negative"
    assert result.reply_required is True

    assert "TEST-001" in fake_provider.received_prompt
    assert "Incorrect product received" in fake_provider.received_prompt
    assert "Please replace it." in fake_provider.received_prompt
    assert "Sales Inquiry" in fake_provider.received_prompt