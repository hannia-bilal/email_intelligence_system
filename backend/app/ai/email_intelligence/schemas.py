from typing import Literal
from pydantic import BaseModel, Field


class EmailInput(BaseModel):
    email_id: str
    sender: str
    receiver: str
    subject: str
    body: str
    date: str


class EmailAnalysis(BaseModel):
    category: Literal[
        "Sales Inquiry",
        "Customer Complaint",
        "Support Request",
        "Meeting Request",
        "Invoice / Payment",
        "Job Application",
        "General Information",
        "Spam",
        "Urgent",
        "Other",
    ]

    intent: str

    priority: Literal[
        "Low",
        "Medium",
        "High",
        "Critical",
    ]

    priority_reason: str

    sentiment: Literal[
        "Positive",
        "Neutral",
        "Negative",
        "Angry",
        "Urgent",
    ]

    sentiment_confidence: float = Field(
        ge=0.0,
        le=1.0
    )

    reply_required: bool

    summary: str