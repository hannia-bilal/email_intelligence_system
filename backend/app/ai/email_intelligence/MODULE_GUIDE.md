# AI Email Intelligence Engine — Module Guide

This document describes the AI Email Intelligence Engine located in `app/ai/email_intelligence/`. It is a module-level developer guide, not a replacement for the repository's general README.

## 1. Purpose

The module analyzes one email and returns a validated, structured AI assessment for the rest of the Email Intelligence System.

Its assigned responsibilities are:

1. Email category classification
2. Intent detection
3. Priority classification and a reason for the priority
4. Sentiment classification and confidence
5. Detection of whether a reply is required
6. Email summarization

The public entry point is `EmailIntelligencePipeline.analyze_email(email)`.

## 2. Scope and boundaries

### Included

- Constructing an analysis prompt from the email fields
- Providing category definitions and analysis rules to the model
- Calling the configured Gemini model
- Requesting JSON output structured by the Pydantic schema
- Validating the model response as `EmailAnalysis`
- Returning the validated result to the caller

### Not included

These responsibilities belong to other project modules and must not be added here without an explicit change to the task division:

- Email provider integration, fetching or sending email
- REST API endpoints or frontend screens
- Database models, persistence, or migrations
- Information extraction as a separate feature
- Action-item or deadline extraction
- An `action_required` field
- Smart-reply generation or reply editing/regeneration

`reply_required` is part of this module. It means whether the email appears to need a response; it is not the same as detecting or tracking an action item.

## 3. Files

Expected module layout:

```text
backend/
├── app/
│   └── ai/
│       └── email_intelligence/
│           ├── __init__.py
│           ├── pipeline.py
│           ├── prompts.py
│           ├── provider.py
│           ├── schemas.py
│           └── MODULE_GUIDE.md
└── tests/
    └── test_email_intelligence_pipeline.py
```

| File | Responsibility |
|---|---|
| `schemas.py` | Defines the input email model and validated analysis output. |
| `prompts.py` | Defines category descriptions and instructions for the model. |
| `provider.py` | Configures the Gemini client, submits the prompt, requests structured JSON, and validates the response. |
| `pipeline.py` | Public orchestration layer: formats the email into a prompt and delegates to the provider. |
| `__init__.py` | Marks the directory as a Python package where present. |
| `MODULE_GUIDE.md` | This module-specific developer guide. |
| `tests/test_email_intelligence_pipeline.py` | Tests pipeline prompt construction and output without a live Gemini request. |

The test path above is relative to `backend/`. If the repository uses a different test layout, update the path to match the actual repository.

## 4. Input and output contracts

### Input: `EmailInput`

Defined in `schemas.py`:

| Field | Meaning |
|---|---|
| `email_id: str` | Identifier for the email in the calling system. |
| `sender: str` | Sender address or display value. |
| `receiver: str` | Recipient address or display value. |
| `subject: str` | Email subject. |
| `body: str` | Email body text. |
| `date: str` | Email date/time represented as a string. |

Example:

```python
from app.ai.email_intelligence.schemas import EmailInput

email = EmailInput(
    email_id="EMAIL-001",
    sender="customer@example.com",
    receiver="support@example.com",
    subject="Incorrect product received",
    body="I ordered a keyboard but received a mouse. Please help.",
    date="2026-10-09",
)
```

### Output: `EmailAnalysis`

Defined in `schemas.py`:

| Field | Type / allowed values | Meaning |
|---|---|---|
| `category` | One of the categories listed below | Primary email category. |
| `intent` | `str` | Concise description of what the sender wants or is communicating. |
| `priority` | `Low`, `Medium`, `High`, `Critical` | Operational urgency. |
| `priority_reason` | `str` | Evidence-based explanation for the assigned priority. |
| `sentiment` | `Positive`, `Neutral`, `Negative`, `Angry`, `Urgent` | Detected tone or sentiment. |
| `sentiment_confidence` | `float`, from `0.0` to `1.0` | Model-reported confidence for sentiment. This is not a guarantee of correctness. |
| `reply_required` | `bool` | Whether a response appears necessary. |
| `summary` | `str` | Concise summary of the email. |

Allowed categories:

- `Sales Inquiry`
- `Customer Complaint`
- `Support Request`
- `Meeting Request`
- `Invoice / Payment`
- `Job Application`
- `General Information`
- `Spam`
- `Urgent`
- `Other`

Pydantic validates the output types, allowed labels, and confidence range. Schema validation ensures the response has the expected structure; it does not independently establish that the model's interpretation is factually correct.

### Summary limitation

The current schema contains one `summary` field. Although the wider project specification mentions short and detailed summaries, this module does not currently expose separate `short_summary` and `detailed_summary` fields. Do not introduce those fields without coordinating the contract change with the team.

## 5. Processing workflow

```text
Caller provides EmailInput
        |
        v
EmailIntelligencePipeline.analyze_email(email)
        |
        v
pipeline.py combines ANALYSIS_PROMPT
and the email's ID, sender, receiver,
subject, body, and date
        |
        v
provider.py sends the prompt to Gemini
with JSON output and EmailAnalysis schema
        |
        v
Gemini returns structured JSON
        |
        v
Pydantic validates the JSON as EmailAnalysis
        |
        v
Validated EmailAnalysis is returned to caller
```

### Responsibilities by layer

1. **`schemas.py` — contract:** defines accepted input and output shapes.
2. **`prompts.py` — model instructions:** defines categories and analysis rules. `ANALYSIS_PROMPT` must interpolate `CATEGORY_DEFINITIONS`; if the definitions appear as a literal `{CATEGORY_DEFINITIONS}`, the category descriptions are not being inserted into the prompt.
3. **`pipeline.py` — orchestration:** assembles the prompt and calls `self.provider.analyze_email(prompt)`.
4. **`provider.py` — model adapter:** reads `GEMINI_API_KEY`, initializes the Gemini client, calls the configured model, requests JSON structured to `EmailAnalysis`, and validates the response.
5. **Caller — integration:** supplies an `EmailInput` and decides how to use or persist the returned analysis. Persistence and UI are outside this module.

Treat the email body as untrusted input. Instructions written inside an email must not override the analysis instructions or output schema.

## 6. Dependencies and configuration

The implementation imports these packages:

- `google-genai` — Gemini API client (`google.genai`)
- `python-dotenv` — loads environment variables from a local `.env` file
- `pydantic` — input/output models and validation
- `pytest` — testing; `monkeypatch` is provided by pytest

The module also uses the Python standard library (`os`).

Install the packages in the active backend environment if they are not already installed:

```bash
python -m pip install google-genai python-dotenv pydantic
python -m pip install pytest
```

If the repository already has a `requirements.txt`, `pyproject.toml`, or another dependency manager file, prefer the repository's declared dependency installation workflow and keep dependency declarations in sync rather than relying only on a manual installation.

### API key

Create or update `backend/.env` (the backend working directory in the current setup) with:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder locally. Never commit `.env`, paste the key into source code, or share the key in chat. Confirm `.env` is covered by `.gitignore`.

`provider.py` currently configures the model as `gemini-3.5-flash-lite`. If that model is unavailable to the configured account or API, update the model identifier only after checking the current Gemini model availability and team requirements.

## 7. How to use the module

Run commands from the `backend/` directory so the `app` package is importable.

```python
from app.ai.email_intelligence.pipeline import EmailIntelligencePipeline
from app.ai.email_intelligence.schemas import EmailInput

email = EmailInput(
    email_id="EMAIL-001",
    sender="customer@example.com",
    receiver="support@example.com",
    subject="Incorrect product received",
    body="I ordered a keyboard but received a mouse. Please help.",
    date="2026-10-09",
)

pipeline = EmailIntelligencePipeline()
analysis = pipeline.analyze_email(email)

print(analysis.model_dump())
print(analysis.category)
print(analysis.priority)
print(analysis.reply_required)
print(analysis.summary)
```

This call uses the real provider and may make an API request. Ensure `GEMINI_API_KEY` is configured and be mindful of API usage.

### Import smoke test

From `backend/`:

```bash
python -c "from app.ai.email_intelligence.pipeline import EmailIntelligencePipeline; print('Import successful')"
```

Expected output:

```text
Import successful
```

### Test without API usage

The pipeline unit test uses a fake provider and should not call Gemini:

```bash
python -m pytest tests/test_email_intelligence_pipeline.py -v
```

Run the full test suite from `backend/`:

```bash
python -m pytest tests/ -v
```

Some other tests may make real API calls if they are not mocked. Review the test implementations before running them if API usage must be avoided.

## 8. Error handling and troubleshooting

The provider implementation is expected to fail clearly when `GEMINI_API_KEY` is missing, when Gemini returns an empty response, when output fails schema validation, or when the API request fails. Check the current `provider.py` implementation for the exact exception behavior.

| Symptom | Checks |
|---|---|
| `ModuleNotFoundError: No module named 'schemas'` | Use package-relative imports inside the module, such as `from .schemas import EmailAnalysis`. |
| `ModuleNotFoundError: No module named 'app'` | Run commands from `backend/`, or configure the project environment so the backend package is importable. |
| Missing API-key error | Check `backend/.env`, the variable name `GEMINI_API_KEY`, and whether `load_dotenv()` can find the file from the current working directory. |
| Model/API error | Check model availability, API key permissions, network connectivity, and provider error details. |
| Schema validation error | Inspect the returned JSON and compare its fields and values with `EmailAnalysis` in `schemas.py`. |
| Category definitions are absent from the prompt | Ensure `ANALYSIS_PROMPT` is an f-string or otherwise interpolates `CATEGORY_DEFINITIONS`. |
| Unit test unexpectedly contacts Gemini | Ensure the test replaces `GeminiProvider` with a fake provider before constructing the pipeline. |

Use package-relative imports within `app/ai/email_intelligence/` so the module works when imported as `app.ai.email_intelligence`.

## 9. Testing strategy

The pipeline unit test should verify that:

- `analyze_email()` accepts an `EmailInput`.
- The assembled prompt includes important email fields and the category instructions.
- The pipeline calls the provider and returns an `EmailAnalysis`.
- The test substitutes a fake provider, so it does not require a key or consume API credits.

Keep prompt construction and schema tests deterministic where possible. Tests that evaluate real model classifications should be treated as integration/evaluation tests because model responses can vary.

## 10. Safe change guidelines

- Preserve `EmailIntelligencePipeline.analyze_email(email)` as the public entry point unless the team agrees to change it.
- Keep `EmailInput` and `EmailAnalysis` aligned with the interface expected by other modules.
- Coordinate schema changes with the API, database, frontend, and other module owners before merging.
- Keep action-item/deadline extraction, separate information extraction, reply generation, database logic, and email integration out of this module's scope.
- Do not log API keys or unnecessarily log full email bodies, which may contain private information.
- Update or add tests whenever changing prompts, category labels, schema fields, or provider behavior.

## 11. Current completion status

The following have been verified in the development session:

- The package import smoke test succeeded.
- The mocked pipeline test `test_analyze_email_builds_prompt_and_returns_analysis` passed (`1 passed`).
- A deprecation warning was reported from the installed `google-genai` library under Python 3.14; it did not cause the pipeline test to fail.

The full test suite and Git commit must be completed by the developer in the repository after reviewing the current working tree.
