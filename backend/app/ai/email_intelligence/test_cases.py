from pipeline import EmailIntelligencePipeline
from schemas import EmailInput


test_emails = [
    EmailInput(
        email_id="test_001",
        sender="customer@example.com",
        receiver="sales@company.com",
        subject="Price for 50 laptops",
        body="""
Hello,

We are looking to purchase 50 laptops for our company.
Could you please send us your available models and pricing?

Regards,
Ahmed
""",
        date="2026-10-01T09:00:00",
    ),

    EmailInput(
        email_id="test_002",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="Damaged product received",
        body="""
Hello,

The laptop I received today has a broken screen.
I am very disappointed and would like a replacement.

Please tell me how I can return it.

Regards,
Ali
""",
        date="2026-10-01T10:00:00",
    ),

    EmailInput(
        email_id="test_003",
        sender="user@example.com",
        receiver="support@company.com",
        subject="Unable to log into my account",
        body="""
Hi,

I have been trying to log into my account since this morning,
but my password is not being accepted.

Can you help me resolve this issue?

Thanks.
""",
        date="2026-10-01T11:00:00",
    ),

    EmailInput(
        email_id="test_004",
        sender="manager@example.com",
        receiver="team@company.com",
        subject="Meeting next week",
        body="""
Hello,

I would like to schedule a meeting with your team next week
to discuss the upcoming project.

Please let me know which time works best for you.

Regards,
Sarah
""",
        date="2026-10-01T12:00:00",
    ),

    EmailInput(
        email_id="test_005",
        sender="billing@example.com",
        receiver="accounts@company.com",
        subject="Invoice #INV-2045",
        body="""
Dear Team,

Please find the invoice for your recent order.
The total amount due is $2,500.

Please confirm once the payment has been processed.

Regards,
Billing Department
""",
        date="2026-10-01T13:00:00",
    ),

    EmailInput(
        email_id="test_006",
        sender="candidate@example.com",
        receiver="jobs@company.com",
        subject="Application for Software Engineer",
        body="""
Dear Hiring Team,

I would like to apply for the Software Engineer position.
Please find my resume attached for your consideration.

I look forward to hearing from you.

Regards,
Hassan
""",
        date="2026-10-01T14:00:00",
    ),

    EmailInput(
        email_id="test_007",
        sender="info@example.com",
        receiver="contact@company.com",
        subject="Office opening hours",
        body="""
Hello,

Could you please tell me your office opening and closing hours?

Thank you.
""",
        date="2026-10-01T15:00:00",
    ),

    EmailInput(
        email_id="test_008",
        sender="random@example.com",
        receiver="user@company.com",
        subject="You won a prize!",
        body="""
Congratulations!

You have won $1,000,000.
Click the link below immediately to claim your prize.

Claim your reward now!
""",
        date="2026-10-01T16:00:00",
    ),

    EmailInput(
        email_id="test_009",
        sender="customer@example.com",
        receiver="support@company.com",
        subject="URGENT: Service completely down",
        body="""
URGENT!

Our production service has completely stopped working.
This is affecting all of our customers.

Please resolve this immediately.

Regards,
Operations Team
""",
        date="2026-10-01T17:00:00",
    ),

    EmailInput(
        email_id="test_010",
        sender="person@example.com",
        receiver="contact@company.com",
        subject="Just saying hello",
        body="""
Hello,

I hope you are doing well.
Have a great day!

Best regards,
John
""",
        date="2026-10-01T18:00:00",
    ),
]


pipeline = EmailIntelligencePipeline()


for email in test_emails:
    print("\n" + "=" * 70)
    print(f"EMAIL ID: {email.email_id}")
    print(f"SUBJECT: {email.subject}")
    print("=" * 70)

    analysis = pipeline.analyze_email(email)

    print(analysis.model_dump_json(indent=2))