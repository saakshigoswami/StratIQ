/**
 * Single chat message with confidence bar, badge, and metrics chips.
 * Assistant messages show: icon, badge, content, confidence bar, optional disclaimer, metrics.
 */
import type { ReactNode } from "react";
import { ConfidenceBar } from "./ConfidenceBar";
import { MetricChips } from "./MetricChip";
import { cn } from "@/lib/utils";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  metrics_used?: string[];
  timestamp: Date;
}

function formatAnswer(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

type ConfidenceTier = "high" | "medium" | "low";

function getConfidenceTier(confidence: number): ConfidenceTier {
  if (confidence > 0.7) return "high";
  if (confidence >= 0.4) return "medium";
  return "low";
}

const BADGE_CONFIG: Record<
  ConfidenceTier,
  { label: string; icon: string; className: string }
> = {
  high: {
    label: "Reliable Insight",
    icon: "🧠",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  },
  medium: {
    label: "Situational Insight",
    icon: "📊",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
  low: {
    label: "Limited Data",
    icon: "⚠️",
    className: "border-red-500/40 bg-red-500/10 text-red-400",
  },
};

export interface ChatMessageProps {
  message: ChatMessageData;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const { role, content, confidence, metrics_used } = message;
  const isAssistant = role === "assistant";
  const tier = confidence != null ? getConfidenceTier(confidence) : null;
  const badge = tier ? BADGE_CONFIG[tier] : null;
  const showDisclaimer = isAssistant && confidence != null && confidence < 0.4;

  if (role === "user") {
    return (
      <div
        className={cn("flex justify-end animate-fade-in", className)}
      >
        <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-primary text-primary-foreground shadow-lg">
          <div className="whitespace-pre-wrap break-words">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex justify-start animate-fade-in", className)}
    >
      <div className="max-w-[85%] rounded-xl border border-border bg-card/95 shadow-lg overflow-hidden">
        {/* Icon + badge row */}
        {badge && (
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
            <span className="text-base leading-none" aria-hidden>
              {badge.icon}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                badge.className
              )}
            >
              {badge.label}
            </span>
          </div>
        )}
        {/* Content */}
        <div className="px-3 py-2 pt-0 text-sm text-foreground">
          <div className="whitespace-pre-wrap break-words">{formatAnswer(content)}</div>
        </div>
        {/* Disclaimer for low confidence */}
        {showDisclaimer && (
          <div className="px-3 pb-2">
            <p className="text-[11px] italic text-muted-foreground">
              This insight is based on limited data.
            </p>
          </div>
        )}
        {/* Confidence bar + metrics (only when we have data) */}
        {(confidence != null || (metrics_used?.length ?? 0) > 0) && (
          <div className="px-3 pb-2.5 space-y-1.5 border-t border-border/50 pt-2 mt-0.5">
            {confidence != null && (
              <ConfidenceBar value={confidence} showLabel />
            )}
            {metrics_used && metrics_used.length > 0 && (
              <MetricChips metrics={metrics_used} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
