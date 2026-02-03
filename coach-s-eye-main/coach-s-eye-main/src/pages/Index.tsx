import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import FilterSidebar from "@/components/layout/FilterSidebar";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import PhaseBreakdown from "@/components/dashboard/PhaseBreakdown";
import CoachingInsights from "@/components/dashboard/CoachingInsights";
import KeyObservations from "@/components/dashboard/KeyObservations";

const Index = () => {
  const [game, setGame] = useState<"valorant" | "lol">("valorant");
  const [playerId, setPlayerId] = useState<string | undefined>(undefined);

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
          onGameChange={(g) => {
            setGame(g);
            setPlayerId(undefined);
          }}
          onPlayerChange={setPlayerId}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Dashboard Grid */}
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Row: Performance Chart */}
            <div className="animate-fade-in">
              <PerformanceChart game={game} playerId={playerId} />
            </div>

            {/* Middle Row: Phase Breakdown */}
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <PhaseBreakdown game={game} playerId={playerId} />
            </div>

            {/* Bottom Row: Insights + Observations */}
            <div
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              {/* Coaching Insights - Takes 2 columns */}
              <div className="lg:col-span-2">
                <CoachingInsights game={game} playerId={playerId} />
              </div>

              {/* Key Observations - Takes 1 column */}
              <div>
                <KeyObservations game={game} playerId={playerId} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
