"""
RAG engine.

Retrieval: ChromaDB vector search using a locally-computed LSA embedding
(TF-IDF + Truncated SVD) — see vector_store.py for details on why this
avoids external model downloads while still giving real semantic search.

Generation: Hugging Face hosted Inference API, configured via .env.
"""
import logging
import re
from typing import List, Tuple

from huggingface_hub import InferenceClient

from app.config import settings
from app.rag.vector_store import retrieve as vector_retrieve

logger = logging.getLogger("ironmind.rag")

THINK_BLOCK_RE = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)

_client: InferenceClient | None = None
if settings.HF_API_TOKEN:
    _client = InferenceClient(
        model=settings.HF_MODEL,
        token=settings.HF_API_TOKEN,
    )
    logger.info("Hugging Face client initialized for model '%s'.", settings.HF_MODEL)
else:
    logger.warning("HF_API_TOKEN not set — AI Coach will run in demo mode.")


def retrieve(query: str, top_k: int = 3) -> List[Tuple[str, str, float]]:
    """Returns list of (doc_id, text, distance) for the top_k most relevant
    chunks, using vector similarity search rather than keyword matching."""
    return vector_retrieve(query, top_k=top_k)


SYSTEM_PROMPT = (
    "You are Coach Ray, an encouraging, knowledgeable AI fitness and nutrition coach inside "
    "the IronMind Fitness app. Use the provided context snippets as your source of truth for "
    "any factual fitness/nutrition claims. Keep answers concise, practical, and safe: no medical "
    "diagnoses, and recommend seeing a doctor for injuries or medical conditions. Tailor advice "
    "to the user's profile (BMI, goal) when given. Use short paragraphs or bullet points. "
    "Respond only with your final answer — do not include any internal reasoning, thinking "
    "steps, or <think> tags."
)


def _fallback_reply(user_message: str, context_chunks: List[str], user_profile: str, reason: str = "") -> str:
    """Deterministic fallback used when no HF_API_TOKEN is configured (or the
    Hugging Face call fails), so the app still works end-to-end out of the box."""
    tips = "\n".join(f"- {c}" for c in context_chunks[:2]) if context_chunks else (
        "- Keep training consistent, eat enough protein, and sleep 7-9 hours."
    )
    reason_line = f"\nReason: {reason}\n" if reason else ""
    return (
        f"(Demo mode — no HF_API_TOKEN configured, or the Hugging Face API call failed){reason_line}\n"
        f"Here's some guidance based on your question:\n{tips}\n\n"
        f"Set HF_API_TOKEN in the backend .env to enable full AI-generated responses."
    )


def generate_reply(user_message: str, user_profile: str = "") -> Tuple[str, List[str]]:
    hits = retrieve(user_message, top_k=3)
    context_chunks = [text for _, text, _ in hits]
    sources = [doc_id for doc_id, _, _ in hits]

    if _client is None:
        return _fallback_reply(user_message, context_chunks, user_profile), sources

    context_block = "\n".join(f"- {c}" for c in context_chunks) or "No specific context found."

    user_content = (
        f"User profile: {user_profile or 'not provided'}\n\n"
        f"Relevant knowledge base context:\n{context_block}\n\n"
        f"User question: {user_message}"
    )

    try:
        completion = _client.chat_completion(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            max_tokens=600,
            temperature=0.6,
        )
        reply = completion.choices[0].message.content
        reply = THINK_BLOCK_RE.sub("", reply).strip()
        return reply, sources
    except Exception as exc:
        logger.error("Hugging Face inference call failed: %s", exc, exc_info=True)
        return _fallback_reply(user_message, context_chunks, user_profile, reason=str(exc)), sources
