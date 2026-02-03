import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalysis, type AnalysisResponse } from "@/lib/api";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface PhaseBreakdownProps {
  game: "valorant" | "lol";
  playerId?: string;
}

type PhaseKey = "early" | "mid" | "late";

const PHASE_LABELS: Record<PhaseKey, string> = {
  early: "Early",
  mid: "Mid",
  late: "Late",
};

const PhaseBreakdown = ({ game, playerId }: PhaseBreakdownProps) => {
  const [activePhase, setActivePhase] = useState<PhaseKey>("early");

  const { data, isLoading, error } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", game, playerId],
    queryFn: () => {
      if (!playerId) throw new Error("No player selected");
      return fetchAnalysis(game, playerId);
    },
    enabled: !!playerId,
  });

  const metrics = useMemo(() => {
    if (!data) return null;
    const phaseRow = data.phase_stats.find((p) => p.game_phase === activePhase);
    if (!phaseRow) return null;

    const kills = Number(phaseRow.kills ?? 0);
    const deaths = Number(phaseRow.deaths ?? 0);
    const damage = Number(phaseRow.damage_dealt ?? 0);
    const kastPct = Number(phaseRow.kast ?? 0) * 100;

    return {
      chartData: [
        { metric: "Kills", value: kills },
        { metric: "Deaths", value: deaths },
        { metric: "Damage", value: Math.round(damage) },
        { metric: "KAST", value: Number.isFinite(kastPct) ? Number(kastPct.toFixed(1)) : 0 },
      ],
      kills,
      deaths,
      damage,
      kastPct,
    };
  }, [data, activePhase]);

  const insightText = useMemo(() => {
    if (!metrics) return "Not enough data for this phase yet.";
    const { kills, deaths, damage, kastPct } = metrics;

    const parts: string[] = [];

    if (damage < 500) {
      parts.push("Damage output is muted in this phase.");
    } else if (damage > 800) {
      parts.push("Damage output is a strong win condition in this phase.");
    }

    if (kastPct < 65) {
      parts.push("KAST drops below a healthy threshold — trades and survivability need attention.");
    } else if (kastPct > 75) {
      parts.push("KAST is excellent; this phase shows reliable contribution and trading.");
    }

    if (deaths > kills) {
      parts.push("Deaths outpace kills, suggesting over‑aggression or poor reset timing.");
    }

    if (!parts.length) {
      parts.push("Phase performance is close to baseline; focus on opponent‑specific prep.");
    }

    return parts.join(" ");
  }, [metrics]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Phase Breakdown</h3>
          <p className="text-sm text-muted-foreground">
            Compare kills, deaths, damage, and KAST across early, mid, and late game.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-secondary/60 p-1">
          {(["early", "mid", "late"] as PhaseKey[]).map((phase) => (
            <button
              key={phase}
              type="button"
              onClick={() => setActivePhase(phase)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                activePhase === phase
                  ? "bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(56,189,248,0.6)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {PHASE_LABELS[phase]}
            </button>
          ))}
        </div>
      </div>

      {!playerId && (
        <p className="text-sm text-muted-foreground">
          Select a player in the left panel, then choose a phase to inspect their profile.
        </p>
      )}
      {playerId && isLoading && (
        <p className="text-sm text-muted-foreground">Loading phase breakdown…</p>
      )}
      {playerId && error && (
        <p className="text-sm text-destructive">
          Failed to load analysis: {(error as Error).message}
        </p>
      )}

      {playerId && !isLoading && metrics && (
        <>
          {/* Chart */}
          <div className="rounded-2xl bg-[#020617]/80 border border-border/60 shadow-[0_24px_60px_rgba(15,23,42,0.9)] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-300/90">
                  {PHASE_LABELS[activePhase]} Phase Metrics
                </p>
                <p className="text-xs text-slate-400">
                  Gamified comparison of core combat stats for this phase.
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/70 text-slate-300">
                Values are normalized per phase
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.chartData} barCategoryGap="25%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.22)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="metric"
                    tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(15,23,42,0.85)" }}
                    contentStyle={{
                      background: "rgba(15,23,42,0.95)",
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,0.4)",
                      padding: "8px 10px",
                    }}
                    labelStyle={{ color: "#e5e7eb", fontSize: 11 }}
                    itemStyle={{ color: "#e5e7eb", fontSize: 11 }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[12, 12, 4, 4]}
                    fill="url(#phaseMetricGradient)"
                  />
                  <defs>
                    <linearGradient id="phaseMetricGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insight text */}
          <div className="rounded-2xl bg-gradient-to-r from-sky-500/10 via-violet-500/10 to-emerald-500/10 border border-sky-500/30 px-5 py-4">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-sky-100/85 mb-1">
              Phase Insight
            </p>
            <p className="text-sm text-slate-100 leading-relaxed">{insightText}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default PhaseBreakdown;
