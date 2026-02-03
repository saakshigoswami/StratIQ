import { Eye, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalysis, type AnalysisResponse } from "@/lib/api";

interface Observation {
  icon: React.ReactNode;
  text: string;
  trend?: "up" | "down";
}

interface KeyObservationsProps {
  game: "valorant" | "lol";
  playerId?: string;
}

const KeyObservations = ({ game, playerId }: KeyObservationsProps) => {
  const { data, isLoading, error } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", game, playerId],
    queryFn: () => {
      if (!playerId) throw new Error("No player selected");
      return fetchAnalysis(game, playerId);
    },
    enabled: !!playerId,
  });

  const observations: Observation[] = [];

  if (data) {
    data.deviations.slice(0, 2).forEach((d) => {
      const isUpMetric = d.direction === "rise" && d.metric !== "deaths";
      const isDownMetric = d.direction === "drop" || (d.direction === "rise" && d.metric === "deaths");
      const icon = isUpMetric ? (
        <TrendingUp className="w-4 h-4 text-success" />
      ) : isDownMetric ? (
        <TrendingDown className="w-4 h-4 text-destructive" />
      ) : (
        <Eye className="w-4 h-4 text-muted-foreground" />
      );
      const trend: "up" | "down" | undefined =
        isUpMetric ? "up" : isDownMetric ? "down" : undefined;
      observations.push({
        icon,
        text: `${d.metric} changed by ${(d.pct_change * 100).toFixed(1)}% vs baseline (${d.direction}).`,
        trend,
      });
    });

    // Add one phase-specific observation if available.
    if (data.phase_deviations.length > 0) {
      const pd = data.phase_deviations[0];
      const icon =
        pd.direction === "drop" && pd.metric !== "deaths" ? (
          <TrendingDown className="w-4 h-4 text-destructive" />
        ) : (
          <Target className="w-4 h-4 text-primary" />
        );
      observations.push({
        icon,
        text: `${pd.phase}-game ${pd.metric} shifted by ${(pd.pct_change * 100).toFixed(
          1,
        )}% compared to baseline.`,
        trend: pd.direction === "drop" ? "down" : "up",
      });
    }
  }

  return (
    <div className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Eye className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Key Observations
          </h3>
          <p className="text-xs text-muted-foreground">
            Notable trends and patterns
          </p>
        </div>
      </div>

      {/* Observations List */}
      <ul className="space-y-3">
        {!playerId && (
          <li className="text-xs text-muted-foreground">
            Select a player to surface key statistical observations.
          </li>
        )}
        {playerId && isLoading && (
          <li className="text-xs text-muted-foreground">Loading observations…</li>
        )}
        {playerId && error && (
          <li className="text-xs text-destructive">
            Failed to load analysis: {(error as Error).message}
          </li>
        )}
        {playerId &&
          !isLoading &&
          observations.map((obs, index) => (
          <li
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <span className="flex-shrink-0 mt-0.5">{obs.icon}</span>
            <span className="text-sm text-foreground leading-relaxed">
              {obs.text}
            </span>
          </li>
        ))}
      </ul>

      {/* Summary */}
      <div className="mt-5 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Last updated</span>
          <span className="text-foreground font-medium">Now</span>
        </div>
      </div>
    </div>
  );
};

export default KeyObservations;
