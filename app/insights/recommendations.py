"""
Insight generator: convert numeric findings into plain-English coaching advice.
"""
from typing import Any

from app.analysis.deviations import detect_deviations, phase_deviations


METRIC_LABELS = {
    "kills": "kills per phase",
    "deaths": "deaths per phase",
    "assists": "assists per phase",
    "damage_dealt": "damage dealt",
    "kast": "KAST (kill/assist/survive/trade)",
    "rounds_won": "rounds won",
}


def _pct_str(pct: float) -> str:
    return f"{abs(round(pct * 100))}%"


def generate_recommendations(
    player_id: str,
    baseline_vs_recent: dict[str, Any],
    deviations: list[dict[str, Any]],
    phase_devs: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Turn deviations and phase deviations into coaching recommendations.
    Each item: { "data": short data fact, "insight": plain-English advice }
    """
    recs = []
    # Overall deviations
    for d in deviations:
        metric = d["metric"]
        label = METRIC_LABELS.get(metric, metric)
        pct = d["pct_change"]
        pct_str = _pct_str(pct)
        if d["direction"] == "drop":
            if metric == "deaths":
                recs.append({
                    "data": f"{player_id}'s deaths increased by {pct_str} in recent matches vs baseline ({d['baseline']:.1f} → {d['recent']:.1f}).",
                    "insight": f"Focus on positioning and life preservation. When {player_id} dies more often, the team loses round control. Review death timings and avoid unnecessary peeks or solo holds.",
                })
            else:
                recs.append({
                    "data": f"{player_id}'s {label} dropped by {pct_str} in recent matches (baseline {d['baseline']:.2f} → recent {d['recent']:.2f}).",
                    "insight": f"Recent form in {label} is below {player_id}'s usual level. Recommend VOD review of recent games and role-specific drills to restore consistency.",
                })
        else:
            if metric != "deaths":
                recs.append({
                    "data": f"{player_id}'s {label} is up {pct_str} vs baseline ({d['baseline']:.2f} → {d['recent']:.2f}).",
                    "insight": f"Positive trend in {label}. Reinforce what's working and keep this in the game plan.",
                })
    # Phase-specific (e.g. mid-game damage drop)
    for d in phase_devs:
        phase = d["phase"]
        metric = d["metric"]
        label = METRIC_LABELS.get(metric, metric)
        pct_str = _pct_str(d["pct_change"])
        if d["direction"] == "drop" and metric == "damage_dealt":
            recs.append({
                "data": f"{player_id}'s {phase}-game damage dropped by {pct_str} compared to baseline ({d['baseline']:.0f} → {d['recent']:.0f}).",
                "insight": f"{player_id}'s {phase}-game impact has slipped. Consider comp adjustments or mid-game role assignments (e.g. resource priority, site takes) to get them more involved in key fights.",
            })
        elif d["direction"] == "drop" and metric == "kast":
            recs.append({
                "data": f"{player_id}'s {phase}-game KAST is down {pct_str} vs baseline.",
                "insight": f"In {phase} game, {player_id} is less often getting a kill, assist, or trade. Review {phase}-game positioning and comms so they're in positions to contribute or trade.",
            })
        elif d["direction"] == "rise" and metric == "deaths":
            recs.append({
                "data": f"{player_id}'s {phase}-game deaths are up {pct_str} vs baseline.",
                "insight": f"Deaths in {phase} game are hurting rounds. Tighten up {phase}-game discipline: avoid isolated deaths and prioritize staying alive for key objectives.",
            })
    # If no deviations, add a generic positive
    if not recs:
        recs.append({
            "data": f"{player_id}'s recent metrics are in line with baseline.",
            "insight": "No major drop-offs detected. Keep current practice and focus on opponent-specific prep.",
        })
    return recs
