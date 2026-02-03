"""
Feature extraction: rolling averages, phase-based stats, baseline vs recent.
"""
from typing import Any

import pandas as pd


# Match order for "recent" vs "baseline" (by match_id; we assume m5 is latest, m1 oldest)
MATCH_ORDER = ["m1", "m2", "m3", "m4", "m5"]


def _match_index(match_id: str) -> int:
    """Order match by index for baseline/recent split."""
    try:
        return MATCH_ORDER.index(match_id)
    except ValueError:
        return 0


def phase_stats(df: pd.DataFrame, player_id: str) -> pd.DataFrame:
    """Aggregate per-phase stats for a player (early/mid/late)."""
    player = df[df["player_id"] == player_id].copy()
    if player.empty:
        return pd.DataFrame()
    return (
        player.groupby("game_phase", observed=True)
        .agg(
            kills=("kills", "mean"),
            deaths=("deaths", "mean"),
            assists=("assists", "mean"),
            damage_dealt=("damage_dealt", "mean"),
            kast=("kast", "mean"),
            rounds_played=("rounds_played", "sum"),
            rounds_won=("rounds_won", "sum"),
        )
        .reset_index()
    )


def baseline_vs_recent(
    df: pd.DataFrame,
    player_id: str,
    recent_n_matches: int = 2,
) -> dict[str, Any]:
    """
    Split player data into baseline (older matches) and recent (last N matches).
    Return aggregated metrics for both and per-phase breakdown.
    """
    player = df[df["player_id"] == player_id].copy()
    if player.empty:
        return {}
    player["_match_idx"] = player["match_id"].map(_match_index)
    player = player.sort_values("_match_idx")
    match_ids = sorted(player["match_id"].unique(), key=_match_index)
    if len(match_ids) <= recent_n_matches:
        recent_ids = set(match_ids)
        baseline_ids = set()
    else:
        recent_ids = set(match_ids[-recent_n_matches:])
        baseline_ids = set(match_ids) - recent_ids
    baseline_df = player[player["match_id"].isin(baseline_ids)]
    recent_df = player[player["match_id"].isin(recent_ids)]
    numeric_cols = ["kills", "deaths", "assists", "damage_dealt", "kast", "rounds_won", "rounds_played"]
    baseline_agg = baseline_df[numeric_cols].mean().to_dict() if not baseline_df.empty else {c: 0.0 for c in numeric_cols}
    recent_agg = recent_df[numeric_cols].mean().to_dict() if not recent_df.empty else baseline_agg.copy()
    baseline_by_phase = (
        baseline_df.groupby("game_phase", observed=True)[numeric_cols].mean().round(4).to_dict("index")
        if not baseline_df.empty
        else {}
    )
    recent_by_phase = (
        recent_df.groupby("game_phase", observed=True)[numeric_cols].mean().round(4).to_dict("index")
        if not recent_df.empty
        else {}
    )
    return {
        "player_id": player_id,
        "baseline": baseline_agg,
        "recent": recent_agg,
        "baseline_by_phase": baseline_by_phase,
        "recent_by_phase": recent_by_phase,
        "baseline_matches": list(baseline_ids),
        "recent_matches": list(recent_ids),
    }


def rolling_averages(df: pd.DataFrame, player_id: str, metrics: list[str] | None = None) -> pd.DataFrame:
    """Rolling average of metrics per match (order by match_id)."""
    if metrics is None:
        metrics = ["kills", "deaths", "assists", "damage_dealt", "kast"]
    player = df[df["player_id"] == player_id].copy()
    if player.empty:
        return pd.DataFrame()
    player["_match_idx"] = player["match_id"].map(_match_index)
    match_agg = player.groupby("match_id").agg({m: "mean" for m in metrics}).reset_index()
    match_agg["_idx"] = match_agg["match_id"].map(_match_index)
    match_agg = match_agg.sort_values("_idx")
    for m in metrics:
        match_agg[f"{m}_rolling"] = match_agg[m].expanding().mean()
    return match_agg
