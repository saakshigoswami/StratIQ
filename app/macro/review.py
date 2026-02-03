"""
Macro review agenda generator.

Goal: produce demo-friendly, explainable bullets coaches can act on.
Works on our normalized per-phase data for both VALORANT and LoL.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd


@dataclass(frozen=True)
class AgendaItem:
    title: str
    data: str
    insight: str


def _fmt_pct(x: float) -> str:
    return f"{round(x * 100)}%"


def generate_macro_review(df: pd.DataFrame, match_id: str, game: str) -> dict[str, Any]:
    """
    Generate a 'Game Review Agenda' for a single match.
    Returns {match_id, game, agenda:[{title,data,insight}], supporting:{...}}.
    """
    game = game.lower()
    mdf = df[df["match_id"] == match_id].copy()
    if mdf.empty:
        return {"match_id": match_id, "game": game, "agenda": [], "supporting": {}}

    agenda: list[AgendaItem] = []

    # Team-level phase performance (using rounds_won/rounds_played if available; otherwise use KAST proxy).
    phase_group = mdf.groupby("game_phase", observed=True).agg(
        damage_dealt=("damage_dealt", "mean"),
        kast=("kast", "mean"),
        deaths=("deaths", "mean"),
        rounds_won=("rounds_won", "sum"),
        rounds_played=("rounds_played", "sum"),
    )
    phase_group["winrate"] = phase_group.apply(
        lambda r: (r["rounds_won"] / r["rounds_played"]) if r["rounds_played"] else None, axis=1
    )

    # Identify weakest phase by winrate if present, else by KAST.
    if phase_group["winrate"].notna().any():
        weakest_phase = phase_group["winrate"].astype(float).idxmin()
        wr = float(phase_group.loc[weakest_phase, "winrate"])
        agenda.append(
            AgendaItem(
                title="Phase focus",
                data=f"Team winrate is lowest in {weakest_phase} phase ({_fmt_pct(wr)}).",
                insight=f"Rewatch key {weakest_phase}-phase decisions (rotations, setup timing). Tighten your default plan to avoid giving away momentum in that window.",
            )
        )
    else:
        weakest_phase = phase_group["kast"].astype(float).idxmin()
        k = float(phase_group.loc[weakest_phase, "kast"])
        agenda.append(
            AgendaItem(
                title="Phase focus",
                data=f"Team KAST is lowest in {weakest_phase} phase ({_fmt_pct(k)}).",
                insight=f"Your {weakest_phase}-phase is where trades/assists/survivability break down. Emphasize pairing and trade protocols during this window.",
            )
        )

    # Map-level performance (Valorant especially)
    if "map" in mdf.columns:
        map_group = mdf.groupby("map").agg(rounds_won=("rounds_won", "sum"), rounds_played=("rounds_played", "sum"))
        map_group["winrate"] = map_group.apply(
            lambda r: (r["rounds_won"] / r["rounds_played"]) if r["rounds_played"] else None, axis=1
        )
        if map_group["winrate"].notna().any():
            worst_map = map_group["winrate"].astype(float).idxmin()
            worst_wr = float(map_group.loc[worst_map, "winrate"])
            agenda.append(
                AgendaItem(
                    title="Map note",
                    data=f"On {worst_map}, round winrate was {_fmt_pct(worst_wr)} in this match.",
                    insight="Build a short map-specific checklist: pistol plan, early defaults, and mid-round pivot triggers. Make sure everyone knows the first two contingency calls.",
                )
            )

    # Player-level “isolated deaths / low contribution” proxy.
    player_group = mdf.groupby("player_id").agg(
        deaths=("deaths", "mean"),
        kast=("kast", "mean"),
        damage=("damage_dealt", "mean"),
    )
    # Identify player with highest deaths and lowest KAST as a likely review point.
    worst_kast_player = player_group["kast"].astype(float).idxmin()
    wk = float(player_group.loc[worst_kast_player, "kast"])
    dp = float(player_group.loc[worst_kast_player, "deaths"])
    agenda.append(
        AgendaItem(
            title="Isolated deaths / trades",
            data=f"{worst_kast_player} had the lowest KAST in the match ({_fmt_pct(wk)}) with {dp:.1f} deaths per phase.",
            insight=f"Review {worst_kast_player}'s deaths: were they traded? If not, adjust spacing and assign a consistent trade partner in the phase where it happens most.",
        )
    )

    # LoL-specific: objective/lead signals if present.
    if game == "lol" and "gold_diff_at_phase" in mdf.columns:
        obj = mdf.groupby("game_phase", observed=True).agg(
            gold_diff=("gold_diff_at_phase", "mean"),
            objective_score=("objective_score", "mean"),
        )
        # Pick mid-phase objective focus if negative swing.
        if "mid" in obj.index:
            gold_mid = float(obj.loc["mid", "gold_diff"])
            if gold_mid < 0:
                agenda.append(
                    AgendaItem(
                        title="Objective setup (LoL)",
                        data=f"Mid-game gold diff averages {gold_mid:.0f} (behind), with objective score {obj.loc['mid','objective_score']:.1f}.",
                        insight="Your mid-game setups are costing you. Sync base timers ~45s before objectives, invest deeper vision, and avoid overcommitting to low-probability contests.",
                    )
                )

    supporting = {
        "phase_summary": phase_group.reset_index().to_dict("records"),
        "player_summary": player_group.reset_index().to_dict("records"),
    }
    return {
        "match_id": match_id,
        "game": game,
        "agenda": [{"title": a.title, "data": a.data, "insight": a.insight} for a in agenda],
        "supporting": supporting,
    }

