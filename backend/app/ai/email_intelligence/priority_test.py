from pipeline import EmailIntelligencePipeline
from schemas import EmailInput


test_emails = [
    EmailInput(
        email_id="priority_001",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Office hours inquiry",
        body="""
Hello,

Could you please tell me your office opening hours?

Thank you.
""",
        date="2026-10-07T09:00:00",
    ),

    EmailInput(
        email_id="priority_002",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Order status update",
        body="""
Hello,

I placed an order three days ago and would like to know
when it is expected to arrive.

Please provide an update.

Regards,
Ahmed
""",
        date="2026-10-07T10:00:00",
    ),

    EmailInput(
        email_id="priority_003",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Replacement needed",
        body="""
Hello,

The laptop I received is damaged and cannot be used.
I need a replacement as soon as possible because I need
it for work.

Please help me resolve this issue.

Regards,
Ali
""",
        date="2026-10-07T11:00:00",
    ),

    EmailInput(
        email_id="priority_004",
        sender="operations@example.com",
        receiver="support@company.com",
        subject="URGENT: Production outage",
        body="""
URGENT!

Our production system is completely down.
All customers are currently unable to access the service.

This is causing a major business disruption.
Please investigate and resolve this immediately.

Operations Team
""",
        date="2026-10-07T12:00:00",
    ),

    EmailInput(
        email_id="priority_005",
        sender="security@example.com",
        receiver="support@company.com",
        subject="CRITICAL: Security breach detected",
        body="""
CRITICAL SECURITY ALERT!

We have detected unauthorized access to our production
system. Customer data may be exposed.

This requires immediate attention from the security team.

Security Operations
""",
        date="2026-10-07T13:00:00",
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