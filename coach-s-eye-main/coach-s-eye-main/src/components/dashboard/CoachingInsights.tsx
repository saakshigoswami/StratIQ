import { Lightbulb, AlertTriangle, Target, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchRecommendations } from "@/lib/api";
import { getPlayerImageUrl } from "@/lib/playerImages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type InsightType = "warning" | "recommendation" | "opportunity";

interface Insight {
  type: InsightType;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface CoachingInsightsProps {
  game: "valorant" | "lol";
  playerId?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="w-5 h-5" />;
    case "recommendation":
      return <Target className="w-5 h-5" />;
    case "opportunity":
      return <Zap className="w-5 h-5" />;
    default:
      return <Lightbulb className="w-5 h-5" />;
  }
};

const getTypeStyles = (type: string) => {
  switch (type) {
    case "warning":
      return {
        border: "border-warning/30",
        bg: "bg-warning/5",
        icon: "text-warning bg-warning/10",
        badge: "bg-warning/10 text-warning",
      };
    case "recommendation":
      return {
        border: "border-primary/30",
        bg: "bg-primary/5",
        icon: "text-primary bg-primary/10",
        badge: "bg-primary/10 text-primary",
      };
    case "opportunity":
      return {
        border: "border-success/30",
        bg: "bg-success/5",
        icon: "text-success bg-success/10",
        badge: "bg-success/10 text-success",
      };
    default:
      return {
        border: "border-border",
        bg: "bg-card",
        icon: "text-muted-foreground bg-muted",
        badge: "bg-muted text-muted-foreground",
      };
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high":
      return "High Priority";
    case "medium":
      return "Medium Priority";
    case "low":
      return "Low Priority";
    default:
      return priority;
  }
};

const CoachingInsights = ({ game, playerId }: CoachingInsightsProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recommendations", game, playerId],
    queryFn: () => {
      if (!playerId) throw new Error("No player selected");
      return fetchRecommendations(game, playerId);
    },
    enabled: !!playerId,
  });

  const mappedInsights: Insight[] | null = data
    ? data.recommendations.map((rec) => {
        const text = rec.insight.toLowerCase();
        const isWarning =
          text.includes("dropped") ||
          text.includes("increased deaths") ||
          text.includes("hurting") ||
          text.includes("slipped");
        const type: InsightType = isWarning ? "warning" : "recommendation";
        return {
          type,
          title: type === "warning" ? "Performance Issue Detected" : "Coaching Recommendation",
          description: `${rec.data} ${rec.insight}`,
          priority: isWarning ? "high" : "medium",
        };
      })
    : null;

  return (
    <div className="insight-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center glow-primary">
          <Lightbulb className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Coaching Recommendations
            </h3>
            <p className="text-sm text-muted-foreground">
              AI-powered insights for performance improvement
            </p>
          </div>
          {playerId && (
            <Avatar className="h-10 w-10 border-2 border-primary/30">
              <AvatarImage src={getPlayerImageUrl(playerId)} alt={playerId} />
              <AvatarFallback className="text-sm">{playerId.slice(0, 2)}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {!playerId && (
          <p className="text-sm text-muted-foreground">
            Select a player in the left panel to generate coaching recommendations.
          </p>
        )}
        {playerId && isLoading && (
          <p className="text-sm text-muted-foreground">Loading recommendations…</p>
        )}
        {playerId && error && (
          <p className="text-sm text-destructive">
            Failed to load recommendations: {(error as Error).message}
          </p>
        )}
        {playerId &&
          !isLoading &&
          mappedInsights &&
          mappedInsights.map((insight, index) => {
          const styles = getTypeStyles(insight.type);
          return (
            <div
              key={index}
              className={`rounded-lg p-4 border ${styles.border} ${styles.bg} transition-all hover:border-primary/40`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.icon}`}
                >
                  {getTypeIcon(insight.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="font-semibold text-foreground">
                      {insight.title}
                    </h4>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}
                    >
                      {getPriorityLabel(insight.priority)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action hint */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Insights are generated from baseline vs recent performance for the selected player.
        </p>
      </div>
    </div>
  );
};

export default CoachingInsights;
