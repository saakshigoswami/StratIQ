"""
Coach Assistant: execute classified query against project data and build response.
Uses only existing analytics — no external LLM.
"""
from __future__ import annotations

from typing import Any

import pandas as pd

from app.chat.intent import IntentType, classify_intent
from app.data.loader import get_players, load_match_stats
from app.macro.review import generate_macro_review

# Cache for loaded data (main.py will inject get_df if needed to reuse its cache)
_df_cache: dict[str, pd.DataFrame] = {}


def _get_df(game: str) -> pd.DataFrame:
    """Get dataframe for game; use cache if set by main, else load once."""
    g = (game or "valorant").lower()
    if g in _df_cache:
        return _df_cache[g]
    _df_cache[g] = load_match_stats(game=g)
    return _df_cache[g]


def set_df_cache(cache: dict[str, pd.DataFrame]) -> None:
    """Allow main.py to inject its _dfs so we reuse the same in-memory data."""
    global _df_cache
    _df_cache = cache


def _answer_phase_best_player(df: pd.DataFrame, phase: str, game: str) -> tuple[str, list[str], float]:
    """
    Who performed best in early/mid/late? Rank players by damage (or KAST) in that phase.
    """
    metrics_used = ["damage_dealt", "kast", "game_phase"]
    subset = df[df["game_phase"] == phase]
    if subset.empty:
        return (
            f"I don't have enough data for the {phase} phase yet. Try asking about early, mid, or late game with our current matches.",
            metrics_used,
            0.3,
        )
    agg = subset.groupby("player_id").agg(
        damage_dealt=("damage_dealt", "mean"),
        kast=("kast", "mean"),
        kills=("kills", "mean"),
    ).round(2)
    agg = agg.sort_values("damage_dealt", ascending=False)
    top = agg.iloc[0]
    top_player = agg.index[0]
    damage = int(top["damage_dealt"])
    kast_pct = int(round(top["kast"] * 100))
    answer = (
        f"In the **{phase}** phase, **{top_player}** performed best: "
        f"highest average damage ({damage}) and KAST at {kast_pct}%. "
        f"Other players in order of damage: " + ", ".join(agg.index[1:].tolist()) + "."
    )
    return answer, metrics_used, 0.9


def _answer_phase_comparison(df: pd.DataFrame, game: str) -> tuple[str, list[str], float]:
    """Compare player performance across early, mid, late."""
    metrics_used = ["damage_dealt", "kast", "game_phase"]
    phases = ["early", "mid", "late"]
    if "game_phase" not in df.columns:
        return "I don't have phase-level data to compare. Check that your data includes early/mid/late phases.", metrics_used, 0.3
    phase_agg = df.groupby("game_phase", observed=True).agg(
        damage=("damage_dealt", "mean"),
        kast=("kast", "mean"),
    ).round(0)
    lines = []
    for p in phases:
        if p not in phase_agg.index:
            continue
        row = phase_agg.loc[p]
        lines.append(f"**{p}**: avg damage {int(row['damage'])}, KAST {int(round(row['kast']*100))}%")
    if not lines:
        return "I don't have enough phase data to compare. Here's what I can tell you: we track early, mid, and late game — ask for a specific phase or player.", metrics_used, 0.4
    answer = "Performance across phases: " + "; ".join(lines) + ". Use Phase Breakdown in the dashboard for per-player comparison."
    return answer, metrics_used, 0.85


def _answer_map_insight(df: pd.DataFrame, game: str) -> tuple[str, list[str], float]:
    """Which map favors aggressive play? Use average damage/kills by map."""
    metrics_used = ["damage_dealt", "kills", "map"]
    if "map" not in df.columns:
        return "I don't have map-level data in this dataset. I can still help with phase or match-level insights.", metrics_used, 0.3
    map_agg = df.groupby("map").agg(
        damage=("damage_dealt", "mean"),
        kills=("kills", "mean"),
    ).round(0)
    map_agg = map_agg.sort_values("damage", ascending=False)
    top_map = map_agg.index[0]
    damage = int(map_agg.loc[top_map, "damage"])
    kills = map_agg.loc[top_map, "kills"]
    answer = (
        f"**{top_map}** has the highest average damage ({damage}) and kills ({kills:.1f}) in our data — it favors more aggressive play. "
        f"Maps by damage: " + ", ".join(f"{m} ({int(map_agg.loc[m,'damage'])} dmg)" for m in map_agg.index) + "."
    )
    return answer, metrics_used, 0.85


def _answer_match_insights(df: pd.DataFrame, match_id: str, game: str) -> tuple[str, list[str], float]:
    """Show insights for match m1 (macro review)."""
    metrics_used = ["game_phase", "kast", "damage_dealt", "rounds_won", "map"]
    if match_id not in df["match_id"].values:
        return (
            f"I don't have data for match **{match_id}**. Available matches: " + ", ".join(sorted(df["match_id"].unique().astype(str))) + ".",
            metrics_used,
            0.3,
        )
    result = generate_macro_review(df, match_id=match_id, game=game)
    agenda = result.get("agenda") or []
    if not agenda:
        return f"Match **{match_id}** has no agenda items yet. I can still show phase and player stats — ask for a specific phase or player.", metrics_used, 0.5
    lines = []
    for a in agenda[:5]:
        lines.append(f"• **{a['title']}**: {a['data']} {a['insight']}")
    answer = f"Insights for match **{match_id}**:\n\n" + "\n\n".join(lines)
    return answer, metrics_used, 0.9


def _answer_phase_issues(df: pd.DataFrame, phase: str, game: str) -> tuple[str, list[str], float]:
    """What went wrong in late (or given) phase? Use phase-level KAST/damage and deviations."""
    metrics_used = ["kast", "damage_dealt", "deaths", "game_phase"]
    subset = df[df["game_phase"] == phase]
    if subset.empty:
        return (
            f"I don't have enough data for the **{phase}** phase. Try 'insights for match m1' or 'who performed best in early'.",
            metrics_used,
            0.3,
        )
    agg = subset.groupby("player_id").agg(
        kast=("kast", "mean"),
        damage_dealt=("damage_dealt", "mean"),
        deaths=("deaths", "mean"),
    ).round(3)
    worst_kast = agg["kast"].idxmin()
    worst_damage = agg["damage_dealt"].idxmin()
    kast_val = agg.loc[worst_kast, "kast"]
    damage_val = agg.loc[worst_damage, "damage_dealt"]
    answer = (
        f"In the **{phase}** phase, **{worst_kast}** had the lowest KAST ({kast_val*100:.0f}%) and "
        f"**{worst_damage}** had the lowest average damage ({int(damage_val)}). "
        f"Focus review on {phase}-phase rotations and trade timing for those players."
    )
    return answer, metrics_used, 0.85


def _answer_player_summary(df: pd.DataFrame, game: str) -> tuple[str, list[str], float]:
    """Generic player summary: list players and suggest asking for a specific player or phase."""
    metrics_used = ["player_id"]
    players = get_players(df)
    names = [p["id"] for p in players[:8]]
    answer = (
        f"I have data for: {', '.join(names)}. "
        "Ask for a specific player (e.g. 'insights for oxy') or phase (e.g. 'who performed best in early game?') and I'll use our analytics to answer."
    )
    return answer, metrics_used, 0.7


def _answer_unknown() -> tuple[str, list[str], float]:
    """Fallback when we can't classify the question."""
    answer = (
        "I don't have enough data for that yet, but here's what I can tell you. "
        "I can answer: **Who performed best in early/mid/late game?** • **Compare performance across early, mid, late** • "
        "**Which map favors aggressive play?** • **Show insights for match m1** • **What went wrong in late game?** "
        "Try one of those or ask about a specific player or phase."
    )
    return answer, [], 0.4


def handle_chat_query(question: str, game: str = "valorant", df: pd.DataFrame | None = None) -> dict[str, Any]:
    """
    Classify the question, run the right analytics, and return a structured response.
    Returns: { "answer": str, "metrics_used": list[str], "confidence": float }
    If df is provided (e.g. from main's cache), it is used; otherwise data is loaded via _get_df.
    """
    intent, params = classify_intent(question)
    df = df if df is not None else _get_df(game)

    if df.empty:
        return {
            "answer": "I don't have any match data loaded yet. Load data and try again.",
            "metrics_used": [],
            "confidence": 0.0,
        }

    answer: str
    metrics_used: list[str]
    confidence: float

    if intent == "phase_best_player":
        phase = params.get("phase", "early")
        answer, metrics_used, confidence = _answer_phase_best_player(df, phase, game)
    elif intent == "phase_comparison":
        answer, metrics_used, confidence = _answer_phase_comparison(df, game)
    elif intent == "map_insight":
        answer, metrics_used, confidence = _answer_map_insight(df, game)
    elif intent == "match_insights":
        match_id = params.get("match_id") or "m1"
        answer, metrics_used, confidence = _answer_match_insights(df, match_id, game)
    elif intent == "phase_issues":
        phase = params.get("phase", "late")
        answer, metrics_used, confidence = _answer_phase_issues(df, phase, game)
    elif intent == "player_summary":
        answer, metrics_used, confidence = _answer_player_summary(df, game)
    else:
        answer, metrics_used, confidence = _answer_unknown()

    # Normalize markdown-style bold for plain text if needed (API can return as-is; frontend can render)
    return {
        "answer": answer,
        "metrics_used": metrics_used,
        "confidence": round(confidence, 2),
    }
