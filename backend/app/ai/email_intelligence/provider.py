import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import ValidationError

from .schemas import EmailAnalysis

load_dotenv()


class GeminiProvider:

    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")

        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-3.5-flash-lite"

    def analyze_email(self, prompt: str) -> EmailAnalysis:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=EmailAnalysis,
                ),
            )

            if not response.text:
                raise ValueError("Gemini returned an empty response.")

            return EmailAnalysis.model_validate_json(response.text)

        except ValidationError as exc:
            raise ValueError(
                "Gemini returned output that does not match the EmailAnalysis schema."
            ) from exc

        except ValueError:
            raise

        except Exception as exc:
            raise RuntimeError(
                f"Gemini email analysis failed: {type(exc).__name__}: {exc}"
            ) from exc