import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopNav from "@/components/layout/TopNav";
import chatbotImg from "@/asset/players/chatbot.png";
import FilterSidebar from "@/components/layout/FilterSidebar";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import PhaseBreakdown from "@/components/dashboard/PhaseBreakdown";
import CoachingInsights from "@/components/dashboard/CoachingInsights";
import KeyObservations from "@/components/dashboard/KeyObservations";
import OverviewDashboard, { type PhaseStat } from "@/components/dashboard/OverviewDashboard";
import AnalysisDashboard from "@/components/dashboard/AnalysisDashboard";
import CoachAssistant from "@/components/dashboard/CoachAssistant";
import { Button } from "@/components/ui/button";
import { fetchAnalysis, type AnalysisResponse } from "@/lib/api";

type ScreenId = "overview" | "phase" | "player" | "coach" | "analysis";

const Index = () => {
  const [game, setGame] = useState<"valorant" | "lol">("valorant");
  const [playerId, setPlayerId] = useState<string | undefined>(undefined);
  const [screen, setScreen] = useState<ScreenId>("overview");
  const [chatOpen, setChatOpen] = useState(true);

  // Lightweight analysis snapshot for Overview screen (phase performance + priority highlight)
  const { data: overviewAnalysis } = useQuery<AnalysisResponse>({
    queryKey: ["overview-analysis", game, playerId],
    queryFn: () => {
      if (!playerId) {
        throw new Error("No player selected");
      }
      return fetchAnalysis(game, playerId);
    },
    enabled: !!playerId,
    staleTime: 60_000,
  });

  let overviewPhaseStats: PhaseStat[] | undefined;
  let overviewHighlight: string | undefined;

  if (overviewAnalysis) {
    const phaseSeries = overviewAnalysis.phase_series ?? [];
    const mapped: PhaseStat[] = [];
    for (const p of phaseSeries) {
      const phaseKey = p.phase.toLowerCase() as PhaseStat["phase"];
      if (!["early", "mid", "late"].includes(phaseKey)) continue;
      const label = phaseKey.charAt(0).toUpperCase() + phaseKey.slice(1);
      const recentKastPct =
        p.recent_kast != null ? Math.round(Number(p.recent_kast) * 100) : 0;
      mapped.push({
        phase: phaseKey,
        label,
        value: recentKastPct,
      });
    }
    if (mapped.length) {
      overviewPhaseStats = mapped;
    }

    // Priority coaching focus: pick the biggest negative deviation (phase-level if available)
    const phaseDevs = overviewAnalysis.phase_deviations ?? [];
    const drops = phaseDevs.filter((d) => d.direction === "drop");
    const deviations = overviewAnalysis.deviations ?? [];

    const pickWorst = <T extends { pct_change: number }>(arr: T[]): T | null => {
      if (!arr.length) return null;
      return arr.reduce((worst, curr) =>
        Math.abs(curr.pct_change) > Math.abs(worst.pct_change) ? curr : worst,
      );
    };

    const worstPhaseDrop = pickWorst(drops);
    if (worstPhaseDrop) {
      const phaseLabel =
        worstPhaseDrop.phase.charAt(0).toUpperCase() + worstPhaseDrop.phase.slice(1);
      const pct = Math.round(Math.abs(worstPhaseDrop.pct_change * 100));
      overviewHighlight = `${phaseLabel} ${worstPhaseDrop.metric.toUpperCase()} dropped ${pct}% vs baseline. Focus coaching on ${phaseLabel.toLowerCase()} rotations, trades, and utility.`;
    } else {
      const worstOverall = pickWorst(deviations);
      if (worstOverall) {
        const pct = Math.round(Math.abs(worstOverall.pct_change * 100));
        overviewHighlight = `${worstOverall.metric.toUpperCase()} dipped ${pct}% vs baseline. Prioritize review of recent maps where this metric struggled.`;
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Layout */}
      <div className="flex">
        {/* Left Sidebar */}
        <FilterSidebar
          game={game}
          playerId={playerId}
          activeScreen={screen}
          onScreenChange={setScreen}
          onGameChange={(g) => {
            setGame(g);
            setPlayerId(undefined);
          }}
          onPlayerChange={setPlayerId}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {screen === "overview" && (
              <div className="animate-fade-in">
                <OverviewDashboard
                  playerId={playerId}
                  phaseStats={overviewPhaseStats}
                  highlight={overviewHighlight}
                  onOpenFullReview={() => setScreen("analysis")}
                />
              </div>
            )}

            {screen === "analysis" && (
              <div className="animate-fade-in">
                <AnalysisDashboard game={game} playerId={playerId} />
              </div>
            )}

            {screen === "phase" && (
              <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <PhaseBreakdown game={game} playerId={playerId} />
              </div>
            )}

            {screen === "player" && (
              <div className="space-y-6">
                <div className="animate-fade-in">
                  <PerformanceChart game={game} playerId={playerId} />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                  <KeyObservations game={game} playerId={playerId} />
                </div>
              </div>
            )}

            {screen === "coach" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="lg:col-span-2">
                  <CoachingInsights game={game} playerId={playerId} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Coach Assistant chatbot: floating button + panel */}
      {!chatOpen && (
        <Button
          className="fixed bottom-6 right-6 z-40 h-12 pl-3 pr-4 rounded-full shadow-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-2"
          onClick={() => setChatOpen(true)}
          aria-label="Open Coach Assistant"
        >
          <img
            src={chatbotImg}
            alt=""
            className="h-8 w-8 object-contain animate-float"
          />
          <span className="text-lg font-semibold leading-none">?</span>
          <span className="text-sm font-medium whitespace-nowrap">hey ask me</span>
        </Button>
      )}
      <CoachAssistant
        game={game}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
};

export default Index;
