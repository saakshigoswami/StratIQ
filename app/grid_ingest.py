"""
Helpers to convert GRID match responses into the tabular format
used by the assistant coach analysis pipeline.

This keeps all the ML / insight code unchanged: once a GRID match
is converted to the same columns as our CSV demo, the rest of the
pipeline (baseline vs recent, deviations, recommendations) just works.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from app.grid_client import fetch_valorant_match, fetch_lol_match


def valorant_match_to_df(match_id: str) -> pd.DataFrame:
    """
    Convert a VALORANT match from GRID to our per-player/per-phase table.

    You MUST adapt the field access below to the real JSON structure
    from your GRID account. The logic is:
      - loop players
      - loop time segments (early/mid/late or round clusters)
      - compute KAST, damage, rounds played/won
    """
    raw = fetch_valorant_match(match_id)

    rows: list[dict[str, Any]] = []

    # The pseudo-structure below is an example; replace with the real one.
    # Example shape:
    # raw = {
    #   "map": "Ascent",
    #   "players": [
    #       {
    #           "id": "oxy",
    #           "segments": [
    #               {"phase": "early", "kills": 3, "deaths": 1, ...},
    #           ],
    #       },
    #   ],
    # }

    match_map = raw.get("map") or raw.get("map_name") or "Unknown"
    players = raw.get("players") or []

    for player in players:
        pid = player.get("id") or player.get("player_id")
        segments = player.get("segments") or []
        for seg in segments:
            phase = seg.get("phase") or "mid"
            rows.append(
                {
                    "player_id": pid,
                    "match_id": match_id,
                    "map": match_map,
                    "game_phase": phase,
                    "kills": seg.get("kills", 0),
                    "deaths": seg.get("deaths", 0),
                    "assists": seg.get("assists", 0),
                    "damage_dealt": seg.get("damage", 0),
                    "kast": seg.get("kast", 0.0),
                    "rounds_played": seg.get("rounds_played", 0),
                    "rounds_won": seg.get("rounds_won", 0),
                }
            )

    return pd.DataFrame(rows)


def lol_match_to_df(match_id: str) -> pd.DataFrame:
    """
    Convert a League of Legends match from GRID to our unified table.

    Here "rounds" are more like phases; we still store early/mid/late
    so that the rest of the code can reason in the same way.
    """
    raw = fetch_lol_match(match_id)

    rows: list[dict[str, Any]] = []
    match_map = raw.get("map") or "SummonersRift"
    players = raw.get("players") or []

    for player in players:
        pid = player.get("id") or player.get("player_id")
        segments = player.get("segments") or []
        for seg in segments:
            phase = seg.get("phase") or "mid"
            rows.append(
                {
                    "player_id": pid,
                    "match_id": match_id,
                    "map": match_map,
                    "game_phase": phase,
                    "kills": seg.get("kills", 0),
                    "deaths": seg.get("deaths", 0),
                    "assists": seg.get("assists", 0),
                    "damage_dealt": seg.get("damage", 0),
                    "kast": seg.get("kast", 0.0),
                    "rounds_played": seg.get("rounds_played", 0),
                    "rounds_won": seg.get("rounds_won", 0),
                }
            )

    return pd.DataFrame(rows)


def grid_match_to_df(game: str, match_id: str) -> pd.DataFrame:
    game = game.lower()
    if game == "lol":
        return lol_match_to_df(match_id)
    return valorant_match_to_df(match_id)

