from .schemas import EmailAnalysis, EmailInput
from .prompts import ANALYSIS_PROMPT
from .provider import GeminiProvider

class EmailIntelligencePipeline:
    def __init__(self):
        self.provider = GeminiProvider()

    def analyze_email(self, email: EmailInput) -> EmailAnalysis:

        prompt = f"""
{ANALYSIS_PROMPT}

Email ID :
 {email.email_id}


Sender :
 {email.sender}


Receiver :
 {email.receiver}


Subject :
 {email.subject}


Body :
 {email.body}


Date :
 {email.date}

"""
            
        return self.provider.analyze_email(prompt)