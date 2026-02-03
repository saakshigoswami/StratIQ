import { useEffect, useState } from "react";
import { ChevronDown, Search, Users, User, Gamepad2, LayoutDashboard, Activity, Target, Lightbulb, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useQuery } from "@tanstack/react-query";
import { fetchPlayers, type PlayerDto } from "@/lib/api";
import { getPlayerImageUrl } from "@/lib/playerImages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ScreenId = "overview" | "phase" | "player" | "coach" | "analysis";

interface FilterSidebarProps {
  game: "valorant" | "lol";
  playerId?: string;
  activeScreen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
  onGameChange: (game: "valorant" | "lol") => void;
  onPlayerChange: (playerId: string | undefined) => void;
}

const FilterSidebar = ({
  game,
  playerId,
  activeScreen,
  onScreenChange,
  onGameChange,
  onPlayerChange,
}: FilterSidebarProps) => {
  const [team, setTeam] = useState<string>("");
  const [localPlayer, setLocalPlayer] = useState<string>("");

  const games = [
    { value: "lol", label: "League of Legends", icon: "🎮" },
    { value: "valorant", label: "VALORANT", icon: "🎯" },
  ];

  const teams = [
    { value: "cloud9", label: "Cloud9" },
    { value: "t1", label: "T1" },
    { value: "fnatic", label: "Fnatic" },
    { value: "gen-g", label: "Gen.G" },
  ];

  const { data: players, isLoading } = useQuery<PlayerDto[]>({
    queryKey: ["players", game],
    queryFn: () => fetchPlayers(game),
  });

  // Keep local selection in sync when parent changes (e.g. when game changes).
  useEffect(() => {
    if (!players || players.length === 0) {
      setLocalPlayer("");
      return;
    }
    // If parent has a player, reflect it; otherwise default to first.
    if (playerId) {
      setLocalPlayer(playerId);
    } else {
      setLocalPlayer(players[0].id);
      onPlayerChange(players[0].id);
    }
  }, [players, playerId, onPlayerChange]);

  return (
    <aside className="w-72 min-h-[calc(100vh-4rem)] border-r border-border bg-sidebar p-6 flex flex-col gap-6">
      {/* App navigation */}
      <nav className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase mb-1">
          Views
        </p>
        {[
          { id: "overview" as ScreenId, label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: "analysis" as ScreenId, label: "Analysis", icon: <BarChart3 className="w-4 h-4" /> },
          { id: "phase" as ScreenId, label: "Phase Breakdown", icon: <Activity className="w-4 h-4" /> },
          { id: "player" as ScreenId, label: "Player Focus", icon: <Target className="w-4 h-4" /> },
          { id: "coach" as ScreenId, label: "Coach Insights", icon: <Lightbulb className="w-4 h-4" /> },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onScreenChange(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeScreen === item.id
                ? "bg-gradient-primary text-primary-foreground shadow-[0_0_18px_rgba(56,189,248,0.65)]"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-black/30 flex items-center justify-center">
                {item.icon}
              </span>
              {item.label}
            </span>
            {activeScreen === item.id && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            )}
          </button>
        ))}
      </nav>

      {/* Filters */}
      <div className="space-y-6 flex-1">
        {/* Game Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-3.5 h-3.5" />
            Select Game
          </label>
          <Select
            value={game}
            onValueChange={(value) => {
              const castValue = value as "valorant" | "lol";
              onGameChange(castValue);
            }}
          >
            <SelectTrigger className="w-full bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="Choose a game" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {games.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  <span className="flex items-center gap-2">
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Team Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Select Team
          </label>
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="w-full bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="Choose a team" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {teams.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Player Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            Select Player
          </label>
          <Select
            value={localPlayer}
            disabled={isLoading || !players || players.length === 0}
            onValueChange={(value) => {
              setLocalPlayer(value);
              onPlayerChange(value);
            }}
          >
            <SelectTrigger className="w-full bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder={isLoading ? "Loading players..." : "Choose a player"}>
                {localPlayer && (
                  <span className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getPlayerImageUrl(localPlayer)} alt={localPlayer} />
                      <AvatarFallback className="text-[10px]">{localPlayer.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span>{players?.find((p) => p.id === localPlayer)?.name ?? localPlayer}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {players?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getPlayerImageUrl(p.id)} alt={p.name} />
                      <AvatarFallback className="text-[10px]">{p.id.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    {p.name}
                  </span>
                </SelectItem>
              )) || null}
            </SelectContent>
          </Select>
        </div>

        {/* Analyze Button — opens Analysis dashboard */}
        <Button
          className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold glow-primary transition-all"
          size="lg"
          disabled={!localPlayer}
          onClick={() => {
            onPlayerChange(localPlayer);
            onScreenChange("analysis");
          }}
        >
          <Search className="w-4 h-4 mr-2" />
          Analyze Performance
        </Button>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-border">
        <div className="glass-card rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-2">Current Analysis</p>
          <p className="text-sm font-medium text-foreground">
            {game ? games.find((g) => g.value === game)?.label : "No game selected"}
          </p>
          {localPlayer && (
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getPlayerImageUrl(localPlayer)} alt={localPlayer} />
                <AvatarFallback className="text-xs">{localPlayer.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-primary">
                {team ? `${teams.find((t) => t.value === team)?.label} → ` : ""}
                {players?.find((p) => p.id === localPlayer)?.name ?? localPlayer}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
