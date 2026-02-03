"""
Analysis logic: detect significant performance deviations and trends.
"""
from typing import Any

import numpy as np


# Thresholds for "significant" change (relative to baseline)
DROP_PCT = 0.15   # 15% drop vs baseline
RISE_PCT = 0.15   # 15% rise vs baseline
MIN_BASELINE = 0.01  # avoid div-by-zero


def pct_change(baseline: float, recent: float) -> float | None:
    """Percent change from baseline to recent. None if baseline too small."""
    if baseline is None or recent is None:
        return None
    b = float(baseline)
    r = float(recent)
    if abs(b) < MIN_BASELINE:
        return None
    return (r - b) / b


def detect_deviations(baseline_vs_recent: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Compare baseline vs recent metrics and flag significant drops/rises.
    Returns list of { metric, baseline, recent, pct_change, direction }.
    """
    baseline = baseline_vs_recent.get("baseline") or {}
    recent = baseline_vs_recent.get("recent") or {}
    metrics = ["kills", "deaths", "assists", "damage_dealt", "kast", "rounds_won"]
    deviations = []
    for m in metrics:
        b = baseline.get(m)
        r = recent.get(m)
        if b is None and r is None:
            continue
        b = b if b is not None else 0.0
        r = r if r is not None else 0.0
        pct = pct_change(b, r)
        if pct is None:
            continue
        # For "good" metrics (higher is better), drop is bad. For "bad" (deaths), rise is bad.
        higher_is_better = m != "deaths"
        if higher_is_better:
            significant_drop = pct <= -DROP_PCT
            significant_rise = pct >= RISE_PCT
        else:
            significant_drop = pct >= RISE_PCT  # deaths going up = drop in performance
            significant_rise = pct <= -DROP_PCT
        if significant_drop or significant_rise:
            direction = "drop" if significant_drop else "rise"
            deviations.append({
                "metric": m,
                "baseline": round(b, 4),
                "recent": round(r, 4),
                "pct_change": round(pct, 4),
                "direction": direction,
            })
    return deviations


def phase_deviations(baseline_vs_recent: dict[str, Any]) -> list[dict[str, Any]]:
    """Detect phase-level deviations (e.g. mid-game damage drops)."""
    base_phase = baseline_vs_recent.get("baseline_by_phase") or {}
    recent_phase = baseline_vs_recent.get("recent_by_phase") or {}
    phases = ["early", "mid", "late"]
    out = []
    for phase in phases:
        b = base_phase.get(phase) or {}
        r = recent_phase.get(phase) or {}
        for m in ["damage_dealt", "kast", "kills", "deaths"]:
            bv = b.get(m)
            rv = r.get(m)
            if bv is None and rv is None:
                continue
            bv = bv if bv is not None else 0.0
            rv = rv if rv is not None else 0.0
            pct = pct_change(bv, rv)
            if pct is None:
                continue
            higher_is_better = m != "deaths"
            if higher_is_better and pct <= -DROP_PCT:
                out.append({
                    "phase": phase,
                    "metric": m,
                    "baseline": round(bv, 4),
                    "recent": round(rv, 4),
                    "pct_change": round(pct, 4),
                    "direction": "drop",
                })
            elif not higher_is_better and pct >= RISE_PCT:
                out.append({
                    "phase": phase,
                    "metric": m,
                    "baseline": round(bv, 4),
                    "recent": round(rv, 4),
                    "pct_change": round(pct, 4),
                    "direction": "rise",
                })
    return out


def detect_trend(rolling_values: list[float]) -> str | None:
    """
    Simple trend: "declining", "improving", or "stable" based on first vs last half.
    """
    if not rolling_values or len(rolling_values) < 2:
        return None
    arr = np.array(rolling_values, dtype=float)
    n = len(arr)
    first_half = arr[: n // 2].mean()
    second_half = arr[n // 2 :].mean()
    if abs(second_half - first_half) < MIN_BASELINE * (abs(first_half) + 1):
        return "stable"
    return "declining" if second_half < first_half else "improving"
