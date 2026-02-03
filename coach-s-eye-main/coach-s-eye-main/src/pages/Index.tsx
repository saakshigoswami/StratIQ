import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import chatbotImg from "@/asset/players/chatbot.png";
import FilterSidebar from "@/components/layout/FilterSidebar";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import PhaseBreakdown from "@/components/dashboard/PhaseBreakdown";
import CoachingInsights from "@/components/dashboard/CoachingInsights";
import KeyObservations from "@/components/dashboard/KeyObservations";
import OverviewDashboard from "@/components/dashboard/OverviewDashboard";
import AnalysisDashboard from "@/components/dashboard/AnalysisDashboard";
import CoachAssistant from "@/components/dashboard/CoachAssistant";
import { Button } from "@/components/ui/button";

type ScreenId = "overview" | "phase" | "player" | "coach" | "analysis";

const Index = () => {
  const [game, setGame] = useState<"valorant" | "lol">("valorant");
  const [playerId, setPlayerId] = useState<string | undefined>(undefined);
  const [screen, setScreen] = useState<ScreenId>("overview");
  const [chatOpen, setChatOpen] = useState(true);

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
                <OverviewDashboard playerId={playerId} />
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
