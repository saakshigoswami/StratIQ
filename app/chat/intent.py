"""
Intent classification for Coach Assistant chatbot.
Keyword/pattern-based — deterministic, no external LLM.
Maps user questions to handler keys so we can route to the right analytics.
"""
import re
from typing import Literal

# Intent types the chatbot can answer from our data
IntentType = Literal[
    "phase_best_player",   # Who performed best in early/mid/late?
    "phase_comparison",    # Compare performance across early, mid, late
    "map_insight",         # Which map favors aggressive play? Map-level stats
    "match_insights",      # Show insights for match m1
    "phase_issues",       # What went wrong in late game?
    "player_summary",     # Summary for a specific player
    "unknown",
]


def _normalize(question: str) -> str:
    """Lowercase and collapse whitespace for matching."""
    return " ".join(re.split(r"\s+", question.strip().lower()))


def _contains_any(text: str, *phrases: str) -> bool:
    return any(p in text for p in phrases)


def _extract_phase(text: str) -> str | None:
    """Extract early/mid/late from question if present."""
    text = _normalize(text)
    if "early" in text or "early game" in text:
        return "early"
    if "mid" in text or "mid game" in text or "mid-game" in text:
        return "mid"
    if "late" in text or "late game" in text or "late-game" in text:
        return "late"
    return None


def _extract_match_id(text: str) -> str | None:
    """Extract match id like m1, m2, m3 from question."""
    text = _normalize(text)
    # Match m1, m2, m3, m4, m5 style
    match = re.search(r"\bm([1-9]\d*)\b", text)
    return match.group(0) if match else None


def classify_intent(question: str) -> tuple[IntentType, dict]:
    """
    Classify the user's question into an intent and return extracted params.
    Returns (intent, params) where params may include phase, match_id, etc.
    """
    if not question or not question.strip():
        return "unknown", {}

    q = _normalize(question)
    params: dict = {}

    # Match-specific: "insights for match m1", "show insights for m2"
    if _contains_any(q, "insight", "review", "agenda") and ("match" in q or re.search(r"\bm[1-9]", q)):
        mid = _extract_match_id(question)
        if mid:
            return "match_insights", {"match_id": mid}
        return "match_insights", {}

    # Phase-specific "what went wrong" / "issues in late game"
    if _contains_any(q, "went wrong", "what went wrong", "issue", "problem", "weak", "struggle") or (
        "wrong" in q and "late" in q
    ):
        phase = _extract_phase(question) or "late"
        return "phase_issues", {"phase": phase}

    # Who performed best in early/mid/late?
    if _contains_any(q, "who performed", "best in", "top performer", "who did best", "best player") or (
        "performed best" in q and (_extract_phase(question) or True)
    ):
        phase = _extract_phase(question) or "early"
        return "phase_best_player", {"phase": phase}

    # Compare performance across early, mid, late
    if _contains_any(
        q,
        "compare",
        "comparison",
        "across early",
        "early mid late",
        "phase performance",
        "performance by phase",
    ):
        return "phase_comparison", {}

    # Map favors aggressive / which map
    if _contains_any(q, "which map", "map favor", "aggressive", "map performance", "best map", "worst map"):
        return "map_insight", {}

    # Player summary / insights for player X
    if _contains_any(q, "player", "for oxy", "for leaf", "summary for"):
        # Optional: extract player name from question if present
        return "player_summary", {}

    return "unknown", {}
