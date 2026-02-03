"""
Data loader for match/player stats.
Loads from CSV or JSON for demo and hackathon use.
"""
import json
from pathlib import Path
from typing import Any

import pandas as pd


def get_data_path() -> Path:
    """Resolve path to data directory (works from project root or app)."""
    base = Path(__file__).resolve().parent.parent.parent
    return base / "data"


def _normalize_schema(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize column names/types across sources (CSV/JSON/GRID).
    Keeps the analysis engine stable even if raw data differs slightly.
    """
    df = df.copy()
    # Historical demo CSV used `round_won`; engine expects `rounds_won`.
    if "round_won" in df.columns and "rounds_won" not in df.columns:
        df = df.rename(columns={"round_won": "rounds_won"})

    # Ensure optional columns exist (LoL may not have these).
    if "rounds_won" not in df.columns:
        df["rounds_won"] = 0
    if "rounds_played" not in df.columns:
        df["rounds_played"] = 0

    # Ensure phase is categorical for nicer grouping.
    if "game_phase" in df.columns:
        df["game_phase"] = df["game_phase"].astype("category")

    # Ensure required ID columns exist.
    for col in ["player_id", "match_id"]:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    return df


def load_match_stats_csv(path: Path) -> pd.DataFrame:
    """Load match stats from CSV. Returns standardized DataFrame."""
    df = pd.read_csv(path)
    return _normalize_schema(df)


def load_match_stats_json(path: Path) -> pd.DataFrame:
    """Load match stats from JSON (array of records). Returns same schema as CSV loader."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return _normalize_schema(pd.DataFrame(data))


def load_match_stats(game: str = "valorant", path: Path | None = None) -> pd.DataFrame:
    """
    Load match stats for a given game.

    - `game="valorant"` → defaults to `data/valorant_match_stats.csv`
    - `game="lol"`      → defaults to `data/lol_match_stats.csv`
    """
    data_path = get_data_path()

    if path is None:
        # Backwards-compatible fallback: if old file exists, still load it.
        if game.lower() == "lol":
            path = data_path / "lol_match_stats.csv"
        else:
            path = data_path / "valorant_match_stats.csv"
            if not path.exists():
                path = data_path / "match_stats.csv"

    base = path if path.is_absolute() else (data_path / path.name)
    if base.suffix.lower() == ".json":
        return load_match_stats_json(base)
    return load_match_stats_csv(base)


def get_players(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Return list of unique players with id and display name for API."""
    ids = df["player_id"].unique().tolist()
    return [{"id": pid, "name": pid} for pid in sorted(ids)]
