/**
 * Reusable horizontal confidence bar (0–1 → %).
 * Green >70%, yellow 40–70%, red <40%. Dark esports theme.
 */
import { cn } from "@/lib/utils";

export interface ConfidenceBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

const pct = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 100);

export function ConfidenceBar({ value, className, showLabel = true }: ConfidenceBarProps) {
  const percent = pct(value);
  const tier: "high" | "medium" | "low" =
    value > 0.7 ? "high" : value >= 0.4 ? "medium" : "low";
  const barColor =
    tier === "high"
      ? "bg-[hsl(var(--success))]"
      : tier === "medium"
        ? "bg-[hsl(var(--warning))]"
        : "bg-[hsl(var(--destructive))]";

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Confidence: {percent}%
        </span>
      )}
      <div
        className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
