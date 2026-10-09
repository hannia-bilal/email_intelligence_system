
CATEGORY_DEFINITIONS = """
Category definitions:

- Sales Inquiry:
  The sender is asking about products, services, pricing, availability,
  quotations, purchasing, or a potential business transaction.

- Customer Complaint:
  The sender is expressing dissatisfaction about a product, service,
  order, delivery, billing issue, or previous interaction and expects
  the problem to be addressed.

- Support Request:
  The sender is asking for technical, account, product, or service
  assistance to solve a problem.

- Meeting Request:
  The sender wants to schedule, reschedule, or arrange a meeting,
  call, or appointment.

- Invoice / Payment:
  The email primarily concerns invoices, payments, billing,
  payment confirmation, or amounts due.

- Job Application:
  The sender is applying for a job, internship, or employment
  opportunity.

- General Information:
  The sender is requesting or providing routine, non-urgent
  information that does not better fit another category.

- Spam:
  The email is unsolicited, deceptive, promotional in a suspicious way,
  phishing-related, or otherwise unwanted.

- Urgent:
  The email describes an urgent or critical situation where immediate
  attention is required and the urgency itself is the primary reason
  for classification.

- Other:
  The email does not reasonably fit any of the categories above.
"""



ANALYSIS_PROMPT = """
Analyze the provided email and return a structured analysis.

Your responsibilities:

1. Classify the email into exactly one category.
2. Identify the sender's intent.
3. Determine the priority.
4. Explain the reason for the priority.
5. Determine the sentiment.
6. Provide sentiment confidence between 0 and 1.
7. Determine whether the sender requires a reply.
8. Generate a concise summary.

{CATEGORY_DEFINITIONS}

Category must be exactly one of:
- Sales Inquiry
- Customer Complaint
- Support Request
- Meeting Request
- Invoice / Payment
- Job Application
- General Information
- Spam
- Urgent
- Other

Priority must be exactly one of:
- Low
- Medium
- High
- Critical

Sentiment must be exactly one of:
- Positive
- Neutral
- Negative
- Angry
- Urgent

Important rules:

- Do not detect action items.
- Do not detect deadlines.
- Do not generate a reply.
- Do not perform separate information extraction.
- Do not invent information that is not present in the email.
- Base the analysis only on the provided email.
"""

