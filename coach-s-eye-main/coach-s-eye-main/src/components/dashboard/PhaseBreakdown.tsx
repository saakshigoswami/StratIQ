import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalysis, type AnalysisResponse } from "@/lib/api";

interface PhaseData {
  phase: string;
  label: string;
  trend: "up" | "down" | "neutral";
  change: number;
  description: string;
  metrics: {
    label: string;
    value: string;
  }[];
}

interface PhaseBreakdownProps {
  game: "valorant" | "lol";
  playerId?: string;
}

const getTrendIcon = (trend: "up" | "down" | "neutral") => {
  switch (trend) {
    case "up":
      return <TrendingUp className="w-5 h-5" />;
    case "down":
      return <TrendingDown className="w-5 h-5" />;
    default:
      return <Minus className="w-5 h-5" />;
  }
};

const getTrendColor = (trend: "up" | "down" | "neutral") => {
  switch (trend) {
    case "up":
      return "text-success bg-success/10 border-success/20";
    case "down":
      return "text-destructive bg-destructive/10 border-destructive/20";
    default:
      return "text-muted-foreground bg-muted/50 border-border";
  }
};

const PhaseBreakdown = ({ game, playerId }: PhaseBreakdownProps) => {
  const { data, isLoading, error } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", game, playerId],
    queryFn: () => {
      if (!playerId) throw new Error("No player selected");
      return fetchAnalysis(game, playerId);
    },
    enabled: !!playerId,
  });

  const phases: PhaseData[] = ["early", "mid", "late"].map((phase) => {
    const phaseRow = data?.phase_series.find((p) => p.phase === phase);
    const baselineKast = (phaseRow?.baseline_kast ?? 0) * 100;
    const recentKast = (phaseRow?.recent_kast ?? 0) * 100;
    const change = baselineKast
      ? ((recentKast - baselineKast) / baselineKast) * 100
      : 0;
    let trend: "up" | "down" | "neutral" = "neutral";
    if (change > 5) trend = "up";
    else if (change < -5) trend = "down";

    const prettyLabel =
      phase === "early" ? "Early Game" : phase === "mid" ? "Mid Game" : "Late Game";

    const description =
      trend === "up"
        ? "Above-baseline impact in this phase"
        : trend === "down"
        ? "Performance below baseline in this phase"
        : "In line with historical baseline";

    return {
      phase,
      label: prettyLabel,
      trend,
      change: Number.isFinite(change) ? Math.round(change) : 0,
      description,
      metrics: [
        {
          label: "Baseline KAST",
          value: baselineKast ? `${baselineKast.toFixed(1)}%` : "—",
        },
        {
          label: "Recent KAST",
          value: recentKast ? `${recentKast.toFixed(1)}%` : "—",
        },
        {
          label: "Damage (recent)",
          value: phaseRow?.recent_damage
            ? Math.round(phaseRow.recent_damage).toString()
            : "—",
        },
      ],
    };
  });
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Phase-Based Breakdown
        </h3>
        <p className="text-sm text-muted-foreground">
          Performance analysis by game phase
        </p>
      </div>

      {!playerId && (
        <p className="text-sm text-muted-foreground">
          Select a player to see how their impact changes across early, mid, and late game.
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

      {playerId && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {phases.map((phase) => (
          <div
            key={phase.phase}
            className="phase-card rounded-xl p-5 border border-border hover:border-primary/30 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-foreground">{phase.label}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {phase.description}
                </p>
              </div>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getTrendColor(
                  phase.trend
                )}`}
              >
                {getTrendIcon(phase.trend)}
                <span className="text-sm font-medium">
                  {phase.change > 0 ? "+" : ""}
                  {phase.change}%
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              {phase.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-xs text-muted-foreground">
                    {metric.label}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Visual indicator bar */}
            <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  phase.trend === "up"
                    ? "bg-success"
                    : phase.trend === "down"
                    ? "bg-destructive"
                    : "bg-muted-foreground"
                }`}
                style={{
                  width: `${Math.min(100, Math.abs(phase.change) * 3 + 40)}%`,
                }}
              />
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default PhaseBreakdown;
