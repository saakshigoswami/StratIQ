"""
Assistant Coach API — Cloud9 × JetBrains Hackathon MVP.
FastAPI backend: players, analysis, recommendations.
"""
import os
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.data.loader import load_match_stats, get_players
from app.features.extraction import baseline_vs_recent, phase_stats, rolling_averages
from app.analysis.deviations import detect_deviations, phase_deviations
from app.insights.recommendations import generate_recommendations
from app.macro.review import generate_macro_review
from app.grid_ingest import grid_match_to_df
from app.chat.query import handle_chat_query


app = FastAPI(
    title="Assistant Coach API",
    description="Comprehensive Assistant Coach MVP — baseline vs recent analysis and coaching recommendations.",
    version="1.0.0",
)

# CORS: allow Vite dev server and production frontend (e.g. Vercel).
_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
if os.getenv("ALLOWED_ORIGINS"):
    _origins.extend(o.strip() for o in os.getenv("ALLOWED_ORIGINS").split(",") if o.strip())
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https?://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load match data once at startup (demo datasets)
_dfs: dict[str, pd.DataFrame] = {}


def get_df(game: str) -> pd.DataFrame:
    g = (game or "valorant").lower()
    if g not in _dfs:
        _dfs[g] = load_match_stats(game=g)
    return _dfs[g]


@app.get("/health")
async def health():
    """Lightweight health check for Railway / load balancers."""
    return {"status": "ok"}


@app.get("/")
async def root():
    """Serve frontend."""
    static = Path(__file__).resolve().parent.parent / "static"
    index = static / "index.html"
    if index.exists():
        return FileResponse(index)
    return {"message": "Assistant Coach API", "docs": "/docs", "players": "/players"}


@app.get("/players")
async def list_players(game: str = "valorant"):
    """Return list of players for dropdown."""
    df = get_df(game)
    return get_players(df)

@app.get("/matches")
async def list_matches(game: str = "valorant"):
    """Return list of match IDs for macro review demo."""
    df = get_df(game)
    matches = sorted(df["match_id"].unique().tolist())
    return [{"id": m} for m in matches]


@app.get("/analysis/{player_id}")
async def get_analysis(player_id: str, game: str = "valorant"):
    """
    Baseline vs recent comparison and phase-level stats for a player.
    Includes deviations and trend-ready rolling metrics for charts.
    """
    df = get_df(game)
    if player_id not in df["player_id"].values:
        raise HTTPException(status_code=404, detail=f"Player not found: {player_id}")
    comparison = baseline_vs_recent(df, player_id, recent_n_matches=2)
    phase = phase_stats(df, player_id)
    rolling = rolling_averages(df, player_id)
    deviations = detect_deviations(comparison)
    phase_devs = phase_deviations(comparison)
    # Chart-friendly: baseline vs recent by phase
    phases = ["early", "mid", "late"]
    baseline_by_phase = comparison.get("baseline_by_phase") or {}
    recent_by_phase = comparison.get("recent_by_phase") or {}
    phase_series = []
    for p in phases:
        phase_series.append({
            "phase": p,
            "baseline_damage": baseline_by_phase.get(p, {}).get("damage_dealt"),
            "recent_damage": recent_by_phase.get(p, {}).get("damage_dealt"),
            "baseline_kast": baseline_by_phase.get(p, {}).get("kast"),
            "recent_kast": recent_by_phase.get(p, {}).get("kast"),
        })
    rolling_list = []
    if not rolling.empty:
        rolling_list = rolling[["match_id", "kills_rolling", "damage_dealt_rolling", "kast_rolling"]].fillna(0).to_dict("records")
    return {
        "player_id": player_id,
        "game": game,
        "baseline_vs_recent": comparison,
        "phase_stats": phase.to_dict("records") if not phase.empty else [],
        "phase_series": phase_series,
        "rolling": rolling_list,
        "deviations": deviations,
        "phase_deviations": phase_devs,
    }


@app.get("/recommendations/{player_id}")
async def get_recommendations(player_id: str, game: str = "valorant"):
    """Plain-English coaching recommendations for a player."""
    df = get_df(game)
    if player_id not in df["player_id"].values:
        raise HTTPException(status_code=404, detail=f"Player not found: {player_id}")
    comparison = baseline_vs_recent(df, player_id, recent_n_matches=2)
    deviations = detect_deviations(comparison)
    phase_devs = phase_deviations(comparison)
    recs = generate_recommendations(player_id, comparison, deviations, phase_devs)
    return {"player_id": player_id, "game": game, "recommendations": recs}


@app.get("/macro_review/{match_id}")
async def macro_review(match_id: str, game: str = "valorant"):
    """
    Automated Macro Game Review — outputs a 'Game Review Agenda' for a concluded match.
    Includes data + reasoning behind insights (demo-friendly for Category 1).
    """
    df = get_df(game)
    if match_id not in df["match_id"].values:
        raise HTTPException(status_code=404, detail=f"Match not found: {match_id}")
    return generate_macro_review(df, match_id=match_id, game=game)


@app.post("/chat/query")
async def chat_query(
    payload: dict = Body(...),
    game: str = "valorant",
):
    """
    Coach Assistant chatbot: answer coaching/analytics questions using only project data.
    Body: { "question": string }
    Optional query param: game=valorant|lol
    Returns: { "answer": string, "metrics_used": string[], "confidence": number }
    """
    question = (payload.get("question") or "").strip()
    if not question:
        return {
            "answer": "Ask a question about performance, phases, maps, or a specific match (e.g. 'Who performed best in early game?').",
            "metrics_used": [],
            "confidence": 0.0,
        }
    df = get_df(game)
    return handle_chat_query(question, game=game, df=df)


@app.post("/ingest/grid_match")
async def ingest_grid_match(
    game: str = "valorant",
    payload: dict = Body(...),
):
    """
    Ingest a single match from GRID and merge it into the in-memory dataset.

    Usage (example):
        POST /ingest/grid_match?game=valorant
        { "match_id": "YOUR_GRID_MATCH_ID" }
    """
    match_id = payload.get("match_id")
    if not match_id:
        raise HTTPException(status_code=400, detail="match_id is required in body")

    # Fetch and convert GRID match into our standard table.
    df_new = grid_match_to_df(game, match_id)
    if df_new.empty:
        raise HTTPException(
            status_code=502,
            detail="GRID match returned no usable rows. Check your mapping in grid_ingest.py.",
        )

    base_df = get_df(game)
    combined = pd.concat([base_df, df_new], ignore_index=True)
    _dfs[game.lower()] = combined

    players = sorted(df_new["player_id"].unique().tolist())
    return {
        "game": game,
        "match_id": match_id,
        "rows_added": len(df_new),
        "players": players,
    }


# Mount static files for frontend (HTML/JS/CSS)
static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
