import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, TrendingDown, Target, Zap, Swords, Lightbulb } from "lucide-react";
import { getPlayerImageUrl } from "@/lib/playerImages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchAnalysis, fetchRecommendations, type AnalysisResponse } from "@/lib/api";

interface AnalysisDashboardProps {
  game: "valorant" | "lol";
  playerId?: string;
}

const AnalysisDashboard = ({ game, playerId }: AnalysisDashboardProps) => {
  const { data: analysis, isLoading: analysisLoading, error: analysisError } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", game, playerId],
    queryFn: () => {
      if (!playerId) throw new Error("No player selected");
      return fetchAnalysis(game, playerId);
    },
    enabled: !!playerId,
  });

  const { data: recommendations } = useQuery({
    queryKey: ["recommendations", game, playerId],
    queryFn: () => {
      if (!playerId) throw new Error("No player selected");
      return fetchRecommendations(game, playerId);
    },
    enabled: !!playerId,
  });

  const playerName = playerId ? playerId.charAt(0).toUpperCase() + playerId.slice(1) : null;

  if (!playerId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center rounded-2xl bg-[#0f0a1a]/60 border border-white/10 p-12 text-center">
        <Target className="w-16 h-16 text-slate-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No player selected</h2>
        <p className="text-slate-400 max-w-sm">
          Select a player in the sidebar and click <strong className="text-primary">Analyze Performance</strong> to open this dashboard.
        </p>
      </div>
    );
  }

  if (analysisLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center rounded-2xl bg-[#0f0a1a]/60 border border-white/10 p-12">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10" />
          <p className="text-slate-400">Loading analysis…</p>
        </div>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center rounded-2xl bg-[#0f0a1a]/60 border border-red-500/30 p-12 text-center">
        <p className="text-red-400 font-medium">Failed to load analysis</p>
        <p className="text-slate-400 text-sm mt-1">{(analysisError as Error).message}</p>
      </div>
    );
  }

  if (!analysis) return null;

  const baseline = analysis.baseline_vs_recent?.baseline ?? {};
  const recent = analysis.baseline_vs_recent?.recent ?? {};
  const baselineKast = (baseline.kast ?? 0) * 100;
  const recentKast = (recent.kast ?? 0) * 100;
  // Circular KAST ring (match overview style)
  const circleRadius = 42;
  const circumference = 2 * Math.PI * circleRadius;
  const safeKast = Math.min(100, Math.max(0, recentKast));
  const strokeDash = (safeKast / 100) * circumference;
  const strokeGap = circumference - strokeDash;
  const baselineDamage = Math.round(baseline.damage_dealt ?? 0);
  const recentDamage = Math.round(recent.damage_dealt ?? 0);
  const phaseChartData = (analysis.phase_series ?? []).map((p) => ({
    phase: p.phase.charAt(0).toUpperCase() + p.phase.slice(1),
    baseline: p.baseline_damage != null ? Math.round(Number(p.baseline_damage)) : 0,
    recent: p.recent_damage != null ? Math.round(Number(p.recent_damage)) : 0,
    baselineKast: p.baseline_kast != null ? Math.round(Number(p.baseline_kast) * 100) : 0,
    recentKast: p.recent_kast != null ? Math.round(Number(p.recent_kast) * 100) : 0,
  }));
  const topRecs = (recommendations?.recommendations ?? []).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1a] via-[#1a0f2e] to-[#020617] px-6 py-6 text-foreground">
      {/* Header: player left, title */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-14 w-14 ring-2 ring-white/10 shadow-lg">
          <AvatarImage src={getPlayerImageUrl(playerId) ?? ""} alt={playerId} />
          <AvatarFallback className="text-lg bg-primary/20 text-primary">
            {playerName?.slice(0, 2) ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-slate-400 text-sm">Performance Analysis</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">{playerName}</h1>
        </div>
      </div>

      {/* Hero card: stats left, circular center, big image right */}
      <div className="rounded-2xl bg-[#0f0a1a]/90 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-6 mb-6 overflow-hidden">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400 mb-5">
          Stats Overview
        </h2>
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Left: baseline vs recent + extra stats */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <div className="flex justify-between items-baseline py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Baseline KAST</span>
              <span className="text-white font-semibold">{Number(baselineKast.toFixed(1))}%</span>
            </div>
            <div className="flex justify-between items-baseline py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Recent KAST</span>
              <span className="text-emerald-400 font-semibold">{Number(recentKast.toFixed(1))}%</span>
            </div>
            <div className="flex justify-between items-baseline py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Baseline Damage</span>
              <span className="text-white font-semibold">{baselineDamage.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-baseline py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Recent Damage</span>
              <span className="text-white font-semibold">{recentDamage.toLocaleString()}</span>
            </div>
            {(analysis.deviations ?? []).slice(0, 2).map((d, i) => (
              <div key={i} className="sm:col-span-2 flex justify-between items-baseline py-2 border-b border-white/5">
                <span className="text-slate-400 text-sm">{d.metric} (vs baseline)</span>
                <span className={d.direction === "drop" ? "text-amber-400" : "text-emerald-400"}>
                  {(d.pct_change * 100).toFixed(1)}% {d.direction}
                </span>
              </div>
            ))}
          </div>

          {/* Center: KAST ring — outer circle with yellow progress ring matching overview */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="analysisKastGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#facc15" />
                  </linearGradient>
                </defs>
                {/* Full grey ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  fill="none"
                  stroke="rgba(148,163,184,0.35)"
                  strokeWidth="8"
                />
                {/* Progress ring in yellow, proportional to recentKast */}
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  fill="none"
                  stroke="url(#analysisKastGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${strokeGap}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{Number(recentKast.toFixed(0))}%</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Recent KAST</span>
              </div>
            </div>
          </div>

          {/* Right: big player image */}
          <div className="flex-shrink-0 flex flex-col items-center justify-end lg:min-w-[280px]">
            <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-xl overflow-hidden border-2 border-white/10 shadow-[0_0_60px_rgba(88,80,236,0.35)]">
              <img
                src={getPlayerImageUrl(playerId) ?? ""}
                alt={playerId}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1a] via-transparent to-transparent pointer-events-none" />
            </div>
            <p className="text-sm font-semibold text-slate-200 mt-3">{playerName}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Analyzed Player</p>
          </div>
        </div>
      </div>

      {/* Phase comparison chart */}
      {phaseChartData.length > 0 && (
        <div className="rounded-2xl bg-[#020617]/80 border border-white/5 shadow-[0_25px_60px_rgba(0,0,0,0.75)] p-6 mb-6">
          <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-200/90 mb-4">
            Damage by phase — Baseline vs Recent
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseChartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="phase" tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.85)" }}
                  contentStyle={{ background: "rgba(15,23,42,0.95)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.4)" }}
                  formatter={(value: number) => [value.toLocaleString(), ""]}
                  labelFormatter={(label) => `Phase: ${label}`}
                />
                <Bar dataKey="baseline" name="Baseline" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recent" name="Recent" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Deviations + Recommendations grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deviations */}
        <div className="rounded-2xl bg-[#0f0a1a]/80 border border-white/10 p-6">
          <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-200/90 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Key deviations
          </h2>
          <ul className="space-y-3">
            {(analysis.deviations ?? []).length === 0 && (
              <li className="text-slate-500 text-sm">No significant deviations from baseline.</li>
            )}
            {(analysis.deviations ?? []).map((d, i) => (
              <li key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                {d.direction === "rise" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-sm text-slate-200">
                  <strong className="text-white">{d.metric}</strong> — {(d.pct_change * 100).toFixed(1)}% {d.direction} (baseline → recent).
                </span>
              </li>
            ))}
            {(analysis.phase_deviations ?? []).slice(0, 2).map((pd, i) => (
              <li key={`phase-${i}`} className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-200">
                  <strong className="text-white">{pd.phase}</strong> {pd.metric} — {(pd.pct_change * 100).toFixed(1)}% {pd.direction}.
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top recommendations */}
        <div className="rounded-2xl bg-[#0f0a1a]/80 border border-white/10 p-6">
          <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-200/90 mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            Coach recommendations
          </h2>
          <ul className="space-y-4">
            {topRecs.length === 0 && (
              <li className="text-slate-500 text-sm">No recommendations yet. Run more matches.</li>
            )}
            {topRecs.map((r, i) => (
              <li key={i} className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Data</p>
                <p className="text-sm text-slate-200 mb-2">{r.data}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Advice</p>
                <p className="text-sm text-primary font-medium">{r.insight}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Phase stats table if available */}
      {(analysis.phase_stats ?? []).length > 0 && (
        <div className="rounded-2xl bg-[#020617]/80 border border-white/5 p-6 mt-6">
          <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-200/90 mb-4 flex items-center gap-2">
            <Swords className="w-4 h-4" />
            Phase stats (avg)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="text-left py-2 pr-4">Phase</th>
                  <th className="text-right py-2 px-2">Kills</th>
                  <th className="text-right py-2 px-2">Deaths</th>
                  <th className="text-right py-2 px-2">Damage</th>
                  <th className="text-right py-2 px-2">KAST %</th>
                </tr>
              </thead>
              <tbody>
                {analysis.phase_stats.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 text-slate-200">
                    <td className="py-2 pr-4 font-medium capitalize">{row.game_phase}</td>
                    <td className="text-right py-2 px-2">{(row.kills ?? 0).toFixed(1)}</td>
                    <td className="text-right py-2 px-2">{(row.deaths ?? 0).toFixed(1)}</td>
                    <td className="text-right py-2 px-2">{Math.round(row.damage_dealt ?? 0).toLocaleString()}</td>
                    <td className="text-right py-2 px-2">{((row.kast ?? 0) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;
