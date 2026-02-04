import type { QueryFunction } from "@tanstack/react-query";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

/** True if VITE_API_BASE_URL was set at build time (so we're not falling back to localhost). */
export const isApiBaseConfigured =
  typeof import.meta.env.VITE_API_BASE_URL === "string" &&
  import.meta.env.VITE_API_BASE_URL.trim() !== "";

export interface PlayerDto {
  id: string;
  name: string;
}

export interface AnalysisResponse {
  player_id: string;
  game: string;
  baseline_vs_recent: {
    baseline: { kast?: number; damage_dealt?: number };
    recent: { kast?: number; damage_dealt?: number };
  };
  phase_stats?: {
    game_phase: string;
    kills?: number;
    deaths?: number;
    assists?: number;
    damage_dealt?: number;
    kast?: number;
    rounds_played?: number;
    rounds_won?: number;
  }[];
  phase_series: {
    phase: string;
    baseline_damage: number | null;
    recent_damage: number | null;
    baseline_kast: number | null;
    recent_kast: number | null;
  }[];
  rolling: {
    match_id: string;
    kills_rolling?: number;
    damage_dealt_rolling?: number;
    kast_rolling?: number;
  }[];
  deviations: {
    metric: string;
    baseline: number;
    recent: number;
    pct_change: number;
    direction: "drop" | "rise";
  }[];
  phase_deviations: {
    phase: string;
    metric: string;
    baseline: number;
    recent: number;
    pct_change: number;
    direction: "drop" | "rise";
  }[];
}

export interface RecommendationsResponse {
  player_id: string;
  game: string;
  recommendations: { data: string; insight: string }[];
}

/** Demo players when API is unreachable (e.g. Vercel without backend). Matches CSV data. */
export const DEMO_PLAYERS: Record<string, PlayerDto[]> = {
  valorant: [
    { id: "oxy", name: "oxy" },
    { id: "leaf", name: "leaf" },
    { id: "jake", name: "jake" },
    { id: "vanity", name: "vanity" },
    { id: "zombs", name: "zombs" },
  ],
  lol: [
    { id: "fudge", name: "fudge" },
    { id: "blaber", name: "blaber" },
    { id: "jojo", name: "jojo" },
    { id: "berserker", name: "berserker" },
    { id: "vulcan", name: "vulcan" },
  ],
};

export async function fetchPlayers(game: string): Promise<PlayerDto[]> {
  const res = await fetch(`${API_BASE}/players?game=${encodeURIComponent(game)}`);
  if (!res.ok) throw new Error(`Failed to load players (${res.status})`);
  return res.json();
}

export interface PlayersWithFallback {
  players: PlayerDto[];
  fromFallback: boolean;
}

/** Fetch players from API; on failure (e.g. Vercel without backend) return demo list so dropdown and images work. */
export async function fetchPlayersWithFallback(game: string): Promise<PlayersWithFallback> {
  try {
    const players = await fetchPlayers(game);
    return { players, fromFallback: false };
  } catch {
    const key = game.toLowerCase() === "lol" ? "lol" : "valorant";
    const players = DEMO_PLAYERS[key] ?? DEMO_PLAYERS.valorant;
    return { players, fromFallback: true };
  }
}

export async function fetchAnalysis(
  game: string,
  playerId: string,
): Promise<AnalysisResponse> {
  const res = await fetch(
    `${API_BASE}/analysis/${encodeURIComponent(playerId)}?game=${encodeURIComponent(game)}`,
  );
  if (!res.ok) throw new Error(`Failed to load analysis (${res.status})`);
  return res.json();
}

export async function fetchRecommendations(
  game: string,
  playerId: string,
): Promise<RecommendationsResponse> {
  const res = await fetch(
    `${API_BASE}/recommendations/${encodeURIComponent(playerId)}?game=${encodeURIComponent(
      game,
    )}`,
  );
  if (!res.ok) throw new Error(`Failed to load recommendations (${res.status})`);
  return res.json();
}

export async function fetchMacroReview(
  game: string,
  matchId: string,
): Promise<{
  match_id: string;
  game: string;
  agenda: { title: string; data: string; insight: string }[];
}> {
  const res = await fetch(
    `${API_BASE}/macro_review/${encodeURIComponent(matchId)}?game=${encodeURIComponent(game)}`,
  );
  if (!res.ok) throw new Error(`Failed to load macro review (${res.status})`);
  return res.json();
}

/** Coach Assistant chatbot: data-driven Q&A using project analytics only */
export interface ChatQueryResponse {
  answer: string;
  metrics_used: string[];
  confidence: number;
}

export async function chatQuery(
  question: string,
  game: string = "valorant",
): Promise<ChatQueryResponse> {
  const res = await fetch(
    `${API_BASE}/chat/query?game=${encodeURIComponent(game)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question.trim() }),
    },
  );
  if (!res.ok) throw new Error(`Chat request failed (${res.status})`);
  return res.json();
}

