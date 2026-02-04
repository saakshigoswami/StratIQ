import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getPlayerImageUrl } from "@/lib/playerImages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type PhaseKey = "early" | "mid" | "late";

export interface PhaseStat {
  phase: PhaseKey;
  label: string;
  value: number;
}

interface OverviewDashboardProps {
  playerId?: string;
  avgKills?: number;
  avgDeaths?: number;
  avgDamage?: number;
  avgKast?: number;
  phaseStats?: PhaseStat[];
  highlight?: string;
  /** Optional callback when user clicks the bottom \"Open Full Review\" button. */
  onOpenFullReview?: () => void;
}

const defaultPhaseStats: PhaseStat[] = [
  { phase: "early", label: "Early", value: 78 },
  { phase: "mid", label: "Mid", value: 62 },
  { phase: "late", label: "Late", value: 84 },
];

const OverviewDashboard = ({
  playerId,
  avgKills = 18.4,
  avgDeaths = 13.2,
  avgDamage = 19450,
  avgKast = 0.72,
  phaseStats = defaultPhaseStats,
  highlight = "Mid‑game KAST dipped 18% below baseline. Focus review on rounds 9–16 and tighten trading protocols.",
  onOpenFullReview,
}: OverviewDashboardProps) => {
  const chartData = phaseStats.map((p) => ({ phase: p.label, value: p.value }));
  const kastPct = Math.round(avgKast * 100);
  const kdRatio = avgDeaths ? (avgKills / avgDeaths).toFixed(2) : "—";
  const playerName = playerId ? playerId.charAt(0).toUpperCase() + playerId.slice(1) : null;
  // Circle: r=42 → circumference = 2πr ≈ 263.9; stroke completes by percentage
  const circleRadius = 42;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDash = (Math.min(100, Math.max(0, kastPct)) / 100) * circumference;
  const strokeGap = circumference - strokeDash;

  const winRatePct = phaseStats.length ? Math.round(phaseStats.reduce((a, p) => a + p.value, 0) / phaseStats.length) : 0;
  const bestPhase = phaseStats.length ? phaseStats.reduce((a, b) => (a.value > b.value ? a : b)).label : "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1a] via-[#1a0f2e] to-[#020617] px-6 py-6 text-foreground">
      {/* Top: header + quick stats row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {playerId ? (
            <Avatar className="h-14 w-14 ring-2 ring-white/10 shadow-lg">
              <AvatarImage src={getPlayerImageUrl(playerId) ?? ""} alt={playerId} />
              <AvatarFallback className="text-lg bg-primary/20 text-primary">
                {playerName?.slice(0, 2) ?? "?"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-slate-500 text-sm">?</span>
            </div>
          )}
          <div>
            <p className="text-slate-400 text-sm">
              Hello {playerName ?? "—"}
            </p>
            <h1 className="text-xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Performance at a glance</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 sm:self-center">
          {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Quick stats row at top */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">K/D Ratio</p>
          <p className="text-lg font-bold text-white mt-0.5">{kdRatio}</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Phase index</p>
          <p className="text-lg font-bold text-amber-400/90 mt-0.5">{winRatePct}%</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Best phase</p>
          <p className="text-lg font-bold text-white mt-0.5">{bestPhase}</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">KAST</p>
          <p className="text-lg font-bold text-yellow-400 mt-0.5">{kastPct}%</p>
        </div>
      </div>

      {/* Hero: STATS OVERVIEW — stats left, circular center, big image right */}
      <div className="rounded-2xl bg-[#0f0a1a]/90 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-6 mb-6 overflow-hidden">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400 mb-5">
          Stats Overview
        </h2>
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Left: text stats */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <div className="flex justify-between items-baseline py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Damage / Round</span>
              <span className="text-white font-semibold">{Math.round(avgDamage / 24).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-baseline py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">K/D Ratio</span>
              <span className="text-white font-semibold">{kdRatio}</span>
            </div>
            <div className="flex justify-between items-baseline py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Kills / Round</span>
              <span className="text-white font-semibold">{(avgKills / 24).toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-baseline py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Avg Damage</span>
              <span className="text-white font-semibold">{Math.round(avgDamage).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-baseline py-2 border-b border-white/5 sm:col-span-2">
              <span className="text-slate-400 text-sm">KAST</span>
              <span className="text-emerald-400 font-semibold">{kastPct}%</span>
            </div>
          </div>

          {/* Center: circular KAST — line around circle completes by percentage (like reference image) */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="overviewKastGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#facc15" />
                  </linearGradient>
                </defs>
                {/* Darker grey outer ring (full circle) */}
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  fill="none"
                  stroke="#374151"
                  strokeWidth="8"
                />
                {/* Progress: lighter grey/purple segment filling kastPct % from top clockwise */}
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  fill="none"
                  stroke="url(#overviewKastGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${strokeGap}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white">{kastPct}%</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">KAST</span>
                <span className="text-[10px] text-emerald-400/90 mt-0.5">Top 20%</span>
              </div>
            </div>
          </div>

          {/* Right: big player image with subtle glow + hover motion */}
          <div className="flex-shrink-0 flex flex-col items-center justify-end lg:min-w-[280px]">
            {playerId ? (
              <>
                <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-xl overflow-hidden border-2 border-white/10 shadow-[0_0_40px_rgba(88,80,236,0.25)] animate-soft-glow transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.02]">
                  <img
                    src={getPlayerImageUrl(playerId) ?? ""}
                    alt={playerId}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1a] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] uppercase tracking-wider">
                    <span className="px-2 py-1 rounded-full bg-black/60 border border-emerald-400/50 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.65)]">
                      {kastPct >= 75 ? "On Fire" : kastPct >= 55 ? "Stable Form" : "Needs Review"}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-black/50 border border-cyan-400/40 text-cyan-200">
                      Phase score {winRatePct}%
                    </span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-200 mt-3">{playerName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Selected Player</p>
              </>
            ) : (
              <div className="w-full max-w-[280px] aspect-[3/4] rounded-xl bg-slate-800/50 border-2 border-dashed border-slate-600 flex items-center justify-center">
                <p className="text-slate-500 text-sm text-center px-4">Select a player in the sidebar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Priority insight banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-400/40 shadow-[0_0_45px_rgba(251,191,36,0.45)] px-6 py-4 flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-300/40 flex items-center justify-center">
            <span className="text-amber-200 text-xl font-semibold">!</span>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-amber-100/90">
              Priority Coaching Focus
            </p>
            <p className="text-sm text-amber-50/95 mt-1 leading-relaxed max-w-3xl">{highlight}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenFullReview}
          disabled={!onOpenFullReview}
          className="hidden sm:inline-flex px-4 py-2 rounded-full bg-amber-400 text-slate-950 text-xs font-semibold tracking-wide shadow-[0_0_25px_rgba(251,191,36,0.7)] hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Open Full Review
        </button>
      </div>

      {/* Phase bar chart */}
      <div className="rounded-2xl bg-[#020617]/80 border border-white/5 shadow-[0_25px_60px_rgba(0,0,0,0.75)] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-200/90">
              Phase Performance
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Relative effectiveness across early, mid, and late game phases
            </p>
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 40 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.18)" horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="phase" type="category" tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(15,23,42,0.85)" }}
                contentStyle={{ background: "rgba(15,23,42,0.95)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.4)", padding: "8px 10px" }}
                labelStyle={{ color: "#e5e7eb", fontSize: 11 }}
                itemStyle={{ color: "#e5e7eb", fontSize: 11 }}
                formatter={(value: unknown) => [`${value}`, "Phase index"]}
              />
              <Bar dataKey="value" radius={[999, 999, 999, 999]} barSize={22} fill="url(#phaseGradient)" />
              <defs>
                <linearGradient id="phaseGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
