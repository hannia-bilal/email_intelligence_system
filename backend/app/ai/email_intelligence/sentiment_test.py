from pipeline import EmailIntelligencePipeline
from schemas import EmailInput


test_emails = [
    EmailInput(
        email_id="sentiment_001",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Thank you for the excellent service",
        body="""
Hello,

I received my order today and everything was perfect.
Thank you for the excellent service and quick delivery.

I am very happy with my purchase.

Regards,
Ahmed
""",
        date="2026-10-02T09:00:00",
    ),

    EmailInput(
        email_id="sentiment_002",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Question about my order",
        body="""
Hello,

I wanted to ask whether my order has been shipped yet.
Could you please provide an update?

Thank you.
""",
        date="2026-10-02T10:00:00",
    ),

    EmailInput(
        email_id="sentiment_003",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Product arrived damaged",
        body="""
Hello,

Unfortunately, the product I received arrived damaged.
The packaging was broken and the product cannot be used.

Please let me know how I can get a replacement.

Regards,
Ali
""",
        date="2026-10-02T11:00:00",
    ),

    EmailInput(
        email_id="sentiment_004",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Very disappointed with your service",
        body="""
This is completely unacceptable.

I have contacted your support team three times and nobody
has solved my problem. I am extremely frustrated and angry
about how this situation has been handled.

I expect this issue to be resolved immediately.

Ahmed
""",
        date="2026-10-02T12:00:00",
    ),

    EmailInput(
        email_id="sentiment_005",
        sender="operations@example.com",
        receiver="support@company.com",
        subject="URGENT: Production system is down",
        body="""
URGENT!

Our production system has stopped working completely.
All customers are currently unable to use the service.

Please investigate this immediately.

Operations Team
""",
        date="2026-10-02T13:00:00",
    ),
]


pipeline = EmailIntelligencePipeline()


for email in test_emails:
    print("\n" + "=" * 70)
    print(f"EMAIL ID: {email.email_id}")
    print(f"SUBJECT: {email.subject}")
    print("=" * 70)

    analysis = pipeline.analyze_email(email)

    print(f"Category:             {analysis.category}")
    print(f"Intent:               {analysis.intent}")
    print(f"Priority:             {analysis.priority}")
    print(f"Priority Reason:      {analysis.priority_reason}")
    print(f"Sentiment:            {analysis.sentiment}")
    print(f"Sentiment Confidence: {analysis.sentiment_confidence}")
    print(f"Reply Required:       {analysis.reply_required}")
    print(f"Summary:              {analysis.summary}")