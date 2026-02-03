/**
 * Small pill/chip for metrics used in a chat response. Dark esports theme.
 */
import { cn } from "@/lib/utils";

const METRIC_LABELS: Record<string, string> = {
  damage_dealt: "DAMAGE",
  kast: "KAST",
  kills: "KILLS",
  deaths: "DEATHS",
  game_phase: "PHASE",
  map: "MAP",
  rounds_won: "ROUNDS",
  player_id: "PLAYER",
};

function formatMetricKey(key: string): string {
  return METRIC_LABELS[key] ?? key.replace(/_/g, " ").toUpperCase();
}

export interface MetricChipProps {
  metricKey: string;
  className?: string;
}

export function MetricChip({ metricKey, className }: MetricChipProps) {
  const label = formatMetricKey(metricKey);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}

export interface MetricChipsProps {
  metrics: string[];
  className?: string;
}

export function MetricChips({ metrics, className }: MetricChipsProps) {
  if (!metrics?.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Metrics used:
      </span>
      {metrics.map((key) => (
        <MetricChip key={key} metricKey={key} />
      ))}
    </div>
  );
}
