import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalysis, type AnalysisResponse } from "@/lib/api";

interface PerformanceChartProps {
  game: "valorant" | "lol";
  playerId?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 border border-border">
        <p className="text-xs font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PerformanceChart = ({ game, playerId }: PerformanceChartProps) => {
  const { data, isLoading, error } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", game, playerId],
    queryFn: () => {
      if (!playerId) throw new Error("No player selected");
      return fetchAnalysis(game, playerId);
    },
    enabled: !!playerId,
  });

  const baselineKast =
    (data?.baseline_vs_recent?.baseline?.kast ?? 0) * 100;

  const chartData =
    data?.rolling.map((r) => ({
      match: r.match_id.toUpperCase(),
      baseline: Math.round(baselineKast),
      recent: Math.round((r.kast_rolling ?? 0) * 100),
    })) ?? [];

  const recentAvg =
    chartData.length > 0
      ? chartData.reduce((acc, d) => acc + d.recent, 0) / chartData.length
      : 0;

  return (
    <div className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Performance Overview
        </h3>
        <p className="text-sm text-muted-foreground">
          Recent performance vs historical baseline
        </p>
      </div>

      {/* Chart */}
      <div className="h-72">
        {!playerId && (
          <p className="text-sm text-muted-foreground">
            Select a player to see baseline vs recent KAST over matches.
          </p>
        )}
        {playerId && isLoading && (
          <p className="text-sm text-muted-foreground">Loading analysis…</p>
        )}
        {playerId && error && (
          <p className="text-sm text-destructive">
            Failed to load analysis: {(error as Error).message}
          </p>
        )}
        {playerId && !isLoading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="recentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(222, 30%, 18%)"
              vertical={false}
            />
            <XAxis
              dataKey="match"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            />
            <YAxis
              domain={[50, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="hsl(215, 20%, 55%)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Baseline Average"
            />
            <Area
              type="monotone"
              dataKey="recent"
              stroke="hsl(187, 100%, 50%)"
              strokeWidth={2}
              fill="url(#recentGradient)"
              dot={{
                fill: "hsl(187, 100%, 50%)",
                strokeWidth: 0,
                r: 4,
              }}
              activeDot={{
                fill: "hsl(187, 100%, 50%)",
                strokeWidth: 2,
                stroke: "hsl(222, 47%, 8%)",
                r: 6,
              }}
              name="Recent Matches"
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Legend/Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Baseline KAST</p>
            <p className="text-lg font-bold text-foreground">
              {baselineKast ? `${baselineKast.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Recent Average KAST</p>
            <p className="text-lg font-bold text-primary">
              {recentAvg ? `${recentAvg.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
