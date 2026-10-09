from pipeline import EmailIntelligencePipeline
from schemas import EmailInput


test_emails = [
    EmailInput(
        email_id="intent_001",
        sender="customer@example.com",
        receiver="sales@company.com",
        subject="Looking for laptops",
        body="""
Hello,

We are planning to purchase around 30 laptops for our new office.
Could you please send us the available models and their prices?

Regards,
Ahmed
""",
        date="2026-10-07T09:00:00",
    ),

    EmailInput(
        email_id="intent_002",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Wrong product received",
        body="""
Hello,

I ordered a wireless keyboard but received a wireless mouse instead.

Please arrange a replacement with the correct product.

Regards,
Ali
""",
        date="2026-10-07T10:00:00",
    ),

    EmailInput(
        email_id="intent_003",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Account password problem",
        body="""
Hello,

I cannot log into my account because my password is not working.

Could you please help me regain access?

Thanks.
""",
        date="2026-10-07T11:00:00",
    ),

    EmailInput(
        email_id="intent_004",
        sender="manager@example.com",
        receiver="team@company.com",
        subject="Project discussion",
        body="""
Hello,

I would like to arrange a meeting with your team to discuss
the next phase of our project.

Please let me know your availability.

Regards,
Sarah
""",
        date="2026-10-07T12:00:00",
    ),

    EmailInput(
        email_id="intent_005",
        sender="billing@example.com",
        receiver="accounts@company.com",
        subject="Payment confirmation required",
        body="""
Dear Team,

Invoice INV-2045 for $2,500 was sent last week.
Could you please confirm whether the payment has been processed?

Regards,
Billing Department
""",
        date="2026-10-07T13:00:00",
    ),

    EmailInput(
        email_id="intent_006",
        sender="candidate@example.com",
        receiver="jobs@company.com",
        subject="Software Engineer Application",
        body="""
Dear Hiring Team,

I am applying for the Software Engineer position.
My resume is attached for your review.

Regards,
Hassan
""",
        date="2026-10-07T14:00:00",
    ),

    EmailInput(
        email_id="intent_007",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Refund request",
        body="""
Hello,

I would like to request a refund for my recent purchase.
The product did not meet my requirements.

Please let me know the refund process.

Regards,
Usman
""",
        date="2026-10-07T15:00:00",
    ),

    EmailInput(
        email_id="intent_008",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Cancel my order",
        body="""
Hello,

I would like to cancel order #ORD-2045 before it is shipped.

Please confirm that the order has been cancelled.

Regards,
Bilal
""",
        date="2026-10-07T16:00:00",
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
    