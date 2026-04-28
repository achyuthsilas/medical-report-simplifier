"""
Medical report simplifier using Groq (Llama 3.3 70B).

Takes raw extracted text from a medical report and returns:
  - A plain-language summary
  - A list of flagged abnormal values (each with name, value, note)
  - A list of questions the patient might want to ask their doctor

Returns structured JSON via prompt engineering. Falls back gracefully on errors.
"""
import json
import re
from typing import Dict, List, Any

from groq import Groq

from app.core.config import settings


SYSTEM_PROMPT = """You are a medical information assistant helping patients
understand their medical reports. You are NOT a doctor and you NEVER provide
diagnosis, treatment plans, or specific medical advice.

Your job: take the raw text of a medical report and produce a JSON object that
helps the patient understand it in plain language.

Rules:
- Use simple, non-technical language a 12-year-old could follow.
- Be empathetic but factual. Avoid scary or alarming language.
- Never invent values not present in the report. If the text is unclear or
  blank, say so honestly.
- Flag values only if the report explicitly indicates they are out of range
  (high/low, abnormal, asterisk, "H", "L", outside reference range, etc.).
- For "questions to ask the doctor", suggest 3-5 specific, useful questions.
- Always include a closing reminder to consult a healthcare provider.

You MUST respond with ONLY a valid JSON object — no markdown, no code fences,
no commentary before or after — matching this exact schema:

{
  "summary": "A 2-4 paragraph plain-language explanation.",
  "flagged_values": [
    {"name": "Test name", "value": "actual value with units", "note": "why this is flagged"}
  ],
  "suggested_questions": [
    "Question 1?",
    "Question 2?"
  ]
}

If no values are flagged, return "flagged_values": [].
If the report text is empty or unreadable, return a summary explaining that
and empty arrays for the others."""


# Cap input length to keep responses fast and within token limits
MAX_INPUT_CHARS = 8000


def _build_user_prompt(report_text: str) -> str:
    truncated = report_text[:MAX_INPUT_CHARS]
    if len(report_text) > MAX_INPUT_CHARS:
        truncated += "\n\n[... report truncated due to length ...]"
    return f"Here is the medical report text:\n\n---\n{truncated}\n---"


def _parse_json_response(raw: str) -> Dict[str, Any]:
    """
    Parse Groq's response. Handles cases where the model wraps JSON in
    markdown code fences despite instructions.
    """
    # Strip code fences if present (```json ... ``` or ``` ... ```)
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)

    # Try to find a JSON object if there's any extra text around it
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        cleaned = match.group(0)

    return json.loads(cleaned)


def _empty_result(message: str) -> Dict[str, Any]:
    """Fallback when AI processing fails."""
    return {
        "summary": message,
        "flagged_values": [],
        "suggested_questions": [],
    }


def simplify_report(report_text: str) -> Dict[str, Any]:
    """
    Main entry point. Returns a dict with:
      - summary (str)
      - flagged_values (list of dicts)
      - suggested_questions (list of strings)
    """
    if not report_text or len(report_text.strip()) < 20:
        return _empty_result(
            "We couldn't extract enough text from this file to analyze. "
            "If it's a scanned image, try uploading a clearer scan or a digital PDF."
        )

    if not settings.GROQ_API_KEY:
        return _empty_result(
            "AI analysis is not configured (missing GROQ_API_KEY). "
            "Please contact the administrator."
        )

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(report_text)},
            ],
            temperature=0.3,        # Lower = more consistent / factual
            max_tokens=1500,
            # Ask Groq for JSON mode if available (works on most Llama models)
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content
        result = _parse_json_response(raw)

        # Validate shape — fill in defaults if model omitted any fields
        return {
            "summary": result.get("summary", "(no summary returned)"),
            "flagged_values": result.get("flagged_values", []),
            "suggested_questions": result.get("suggested_questions", []),
        }

    except json.JSONDecodeError as e:
        print(f"[simplifier] JSON parse error: {e}")
        return _empty_result(
            "The AI returned a response we couldn't parse. Please try again."
        )
    except Exception as e:
        print(f"[simplifier] Groq API error: {e}")
        return _empty_result(
            f"AI analysis failed: {type(e).__name__}. Please try again later."
        )
