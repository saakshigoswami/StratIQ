import { useMemo, useState } from "react";
import { Trophy, Flame, Brain, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayers, fetchAnalysis, type AnalysisResponse, type PlayerDto } from "@/lib/api";
import { getPlayerImageUrl } from "@/lib/playerImages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type FocusMetric = "overall" | "damage" | "kast" | "kda";

interface TopPerformer {
  player: PlayerDto;
  damage: number;
  kastPct: number;
  kills: number;
  deaths: number;
  kda: number;
  scoreOverall: number;
}

interface TopPerformersProps {
  game: "valorant" | "lol";
}

/** Compute composite score from basic stats.
 *  score = damage * 0.5 + KAST% * 0.3 + (kills - deaths) * 0.2
 */
function computeScore(damage: number, kastPct: number, kills: number, deaths: number): number {
  const kdDiff = kills - deaths;
  return damage * 0.5 + kastPct * 0.3 + kdDiff * 0.2;
}

function buildPerformer(player: PlayerDto, analysis: AnalysisResponse): TopPerformer {
  const baseline = analysis.baseline_vs_recent?.baseline ?? {};
  const recent = analysis.baseline_vs_recent?.recent ?? {};

  const recentDamage = Number.isFinite(recent.damage_dealt)
    ? Math.round(Number(recent.damage_dealt))
    : Math.round(Number(baseline.damage_dealt ?? 0));
  const recentKastPct = Number.isFinite(recent.kast)
    ? Math.round(Number(recent.kast) * 100)
    : Math.round(Number(baseline.kast ?? 0) * 100);

  let kills = 0;
  let deaths = 0;
  for (const s of analysis.phase_stats ?? []) {
    kills += s.kills ?? 0;
    deaths += s.deaths ?? 0;
  }
  const kda = deaths > 0 ? kills / deaths : kills;

  return {
    player,
    damage: recentDamage,
    kastPct: recentKastPct,
    kills,
    deaths,
    kda,
    scoreOverall: computeScore(recentDamage, recentKastPct, kills, deaths),
  };
}

const TopPerformers = ({ game }: TopPerformersProps) => {
  const [focus, setFocus] = useState<FocusMetric>("overall");

  const { data, isLoading, error } = useQuery<TopPerformer[]>({
    queryKey: ["top-performers", game],
    queryFn: async () => {
      const players = await fetchPlayers(game);
      if (!players.length) return [];

      const results: TopPerformer[] = [];
      for (const p of players) {
        try {
          const analysis = await fetchAnalysis(game, p.id);
          results.push(buildPerformer(p, analysis));
        } catch {
          // Skip players that fail analysis fetch to keep UI stable.
        }
      }
      return results;
    },
    staleTime: 60_000,
  });

  const performers = data ?? [];

  const {
    sorted,
    maxDamage,
    maxKast,
    maxKda,
    minScore,
    maxScore,
  } = useMemo(() => {
    if (!performers.length) {
      return {
        sorted: [] as TopPerformer[],
        maxDamage: 0,
        maxKast: 0,
        maxKda: 0,
        minScore: 0,
        maxScore: 0,
      };
    }

    const maxDamageVal = Math.max(...performers.map((p) => p.damage));
    const maxKastVal = Math.max(...performers.map((p) => p.kastPct));
    const maxKdaVal = Math.max(...performers.map((p) => p.kda));
    const minScoreVal = Math.min(...performers.map((p) => p.scoreOverall));
    const maxScoreVal = Math.max(...performers.map((p) => p.scoreOverall));

    const sortedPerfs = [...performers].sort((a, b) => {
      switch (focus) {
        case "damage":
          return b.damage - a.damage;
        case "kast":
          return b.kastPct - a.kastPct;
        case "kda":
          return b.kda - a.kda;
        default:
          return b.scoreOverall - a.scoreOverall;
      }
    });

    return {
      sorted: sortedPerfs.slice(0, 5),
      maxDamage: maxDamageVal,
      maxKast: maxKastVal,
      maxKda: maxKdaVal,
      minScore: minScoreVal,
      maxScore: maxScoreVal,
    };
  }, [performers, focus]);

  const computeConfidence = (score: number): number => {
    if (maxScore === minScore) return 82;
    const norm = (score - minScore) / (maxScore - minScore);
    return Math.round(70 + norm * 25); // 70–95%
  };

  const buildBadge = (p: TopPerformer) => {
    if (p.damage === maxDamage) {
      return { icon: <Flame className="w-4 h-4" />, label: "Top Damage" };
    }
    if (p.kastPct === maxKast) {
      return { icon: <Brain className="w-4 h-4" />, label: "Consistency" };
    }
    if (p.kda === maxKda) {
      return { icon: <Zap className="w-4 h-4" />, label: "Clutch Impact" };
    }
    return { icon: <Trophy className="w-4 h-4" />, label: "Overall Impact" };
  };

  const buildInsight = (p: TopPerformer): string => {
    if (p.damage === maxDamage && p.kastPct >= 65) {
      return "High damage output with reliable trades.";
    }
    if (p.kastPct === maxKast) {
      return "Stays alive, trades well, and anchors rounds.";
    }
    if (p.kda === maxKda) {
      return "Wins duels and converts fights efficiently.";
    }
    if (p.damage >= maxDamage * 0.85) {
      return "Strong round-to-round pressure through damage.";
    }
    return "Balanced impact across damage, KAST, and fights.";
  };

  const formatPrimaryMetric = (p: TopPerformer): { label: string; value: string } => {
    switch (focus) {
      case "damage":
        return { label: "Recent Damage", value: p.damage.toLocaleString() };
      case "kast":
        return { label: "Recent KAST", value: `${p.kastPct}%` };
      case "kda":
        return { label: "KDA (approx.)", value: p.kda.toFixed(2) };
      default:
        return { label: "Composite Score", value: Math.round(p.scoreOverall).toString() };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1a] via-[#1a0f2e] to-[#020617] px-6 py-6 text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.7)]">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Top Performers</h1>
              <p className="text-xs text-muted-foreground">
                Ranked by composite score using damage, KAST, and KDA.
              </p>
            </div>
          </div>

          {/* Focus toggle */}
          <div className="inline-flex rounded-full bg-secondary/60 border border-border p-1 text-xs">
            {(["overall", "damage", "kast", "kda"] as FocusMetric[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFocus(key)}
                className={`px-3 py-1 rounded-full capitalize transition text-[11px] ${
                  focus === key
                    ? "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(56,189,248,0.7)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {key === "kda" ? "KDA" : key}
              </button>
            ))}
          </div>
        </div>

        {/* Content states */}
        {isLoading && (
          <p className="text-xs text-muted-foreground">Loading top performers…</p>
        )}
        {error && (
          <p className="text-xs text-destructive">
            Failed to load top performers: {(error as Error).message}
          </p>
        )}
        {!isLoading && !error && !sorted.length && (
          <p className="text-xs text-muted-foreground">
            No performance data available yet. Select a game with match data.
          </p>
        )}

        {/* Cards grid */}
        {sorted.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {sorted.map((p, index) => {
              const avatarUrl = getPlayerImageUrl(p.player.id) ?? "";
              const initials = p.player.id.slice(0, 2).toUpperCase();
              const badge = buildBadge(p);
              const insight = buildInsight(p);
              const primary = formatPrimaryMetric(p);
              const confidence = computeConfidence(p.scoreOverall);
              const isTopRank = index === 0;

              return (
                <div
                  key={p.player.id}
                  className={`relative rounded-2xl border px-4 py-4 bg-[#020617]/80 flex flex-col gap-3 transition hover:border-primary/60 hover:shadow-[0_0_30px_rgba(56,189,248,0.55)] ${
                    isTopRank
                      ? "border-amber-400/70 shadow-[0_0_40px_rgba(251,191,36,0.6)]"
                      : "border-white/8 shadow-[0_18px_40px_rgba(0,0,0,0.7)]"
                  }`}
                >
                  {/* Rank marker */}
                  <span className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-black/80 border border-amber-400/70 flex items-center justify-center text-xs font-semibold text-amber-300">
                    #{index + 1}
                  </span>

                  {/* Header: avatar + name + role */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-white/10">
                      <AvatarImage src={avatarUrl} alt={p.player.id} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {p.player.id}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Role: Flex / Entry (demo)
                      </p>
                    </div>
                  </div>

                  {/* Primary metric + badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {primary.label}
                      </p>
                      <p className="text-lg font-bold text-white mt-0.5">
                        {primary.value}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-cyan-100">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-black/30">
                        {badge.icon}
                      </span>
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Insight and confidence */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                    <span>
                      Confidence:{" "}
                      <span className="text-emerald-400 font-semibold">
                        {confidence}%
                      </span>
                    </span>
                    <span
                      className="cursor-help underline decoration-dotted underline-offset-4"
                      title="Ranking formula: damage (50%), KAST% (30%), and (kills − deaths) (20%)."
                    >
                      How this is ranked?
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopPerformers;

