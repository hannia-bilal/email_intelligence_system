from pipeline import EmailIntelligencePipeline
from schemas import EmailInput


email = EmailInput(
    email_id="email_001",
    sender="ahmed@example.com",
    receiver="support@company.com",
    subject="Wrong product received",
    body="""
Hello,

I ordered a wireless keyboard from your company, but I received a
wireless mouse instead. I would like you to replace the item with the
keyboard I originally ordered.

Please let me know how I can return the incorrect product.

Regards,
Ahmed
""",
    date="2026-10-01T10:30:00",
)


pipeline = EmailIntelligencePipeline()

analysis = pipeline.analyze_email(email)

print(analysis.model_dump_json(indent=2))