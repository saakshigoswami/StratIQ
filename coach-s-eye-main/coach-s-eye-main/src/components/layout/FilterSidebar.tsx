import { useEffect, useState } from "react";
import { ChevronDown, Search, Users, User, Gamepad2 } from "lucide-react";
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

interface FilterSidebarProps {
  game: "valorant" | "lol";
  playerId?: string;
  onGameChange: (game: "valorant" | "lol") => void;
  onPlayerChange: (playerId: string | undefined) => void;
}

const FilterSidebar = ({
  game,
  playerId,
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
    <aside className="w-72 min-h-[calc(100vh-4rem)] border-r border-border bg-sidebar p-6 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-1">
          Control Panel
        </h2>
        <p className="text-xs text-muted-foreground">
          Configure your analysis parameters
        </p>
      </div>

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
              <SelectValue
                placeholder={isLoading ? "Loading players..." : "Choose a player"}
              />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {players?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              )) || null}
            </SelectContent>
          </Select>
        </div>

        {/* Analyze Button */}
        <Button
          className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold glow-primary transition-all"
          size="lg"
          disabled={!localPlayer}
          onClick={() => onPlayerChange(localPlayer)}
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
          {team && (
            <p className="text-xs text-primary mt-1">
              {teams.find((t) => t.value === team)?.label}
              {localPlayer &&
                ` → ${players?.find((p) => p.id === localPlayer)?.name ?? localPlayer}`}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
