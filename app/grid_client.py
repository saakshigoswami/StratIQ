"""
Simple GRID API client.

Reads credentials from environment / .env and exposes helper functions
for fetching match data. You still need to map the exact endpoint paths
and JSON fields from the GRID docs.
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

GRID_API_KEY = os.getenv("GRID_API_KEY")
GRID_BASE_URL = os.getenv("GRID_BASE_URL", "https://api.grid.gg").rstrip("/")


def _get_client() -> httpx.Client:
  if not GRID_API_KEY:
      raise RuntimeError("GRID_API_KEY is not set. Add it to your .env file.")
  return httpx.Client(
      base_url=GRID_BASE_URL,
      headers={"Authorization": f"Bearer {GRID_API_KEY}"},
      timeout=30.0,
  )


def fetch_valorant_match(match_id: str) -> dict[str, Any]:
  """
  Fetch VALORANT match data from GRID.

  NOTE: You *must* adjust the path and params to match the GRID tutorials
  for your account, e.g. something like:

      /valorant/matches/{match_id}

  Here we keep it generic so you can quickly adapt it once you confirm the
  correct endpoint in the GRID docs.
  """
  client = _get_client()
  # TODO: update this path to the exact VALORANT endpoint you are using
  path = f"/valorant/matches/{match_id}"
  resp = client.get(path)
  resp.raise_for_status()
  return resp.json()


def fetch_lol_match(match_id: str) -> dict[str, Any]:
  """
  Fetch League of Legends match data from GRID.
  """
  client = _get_client()
  # TODO: update this path to the exact LoL endpoint you are using
  path = f"/lol/matches/{match_id}"
  resp = client.get(path)
  resp.raise_for_status()
  return resp.json()

