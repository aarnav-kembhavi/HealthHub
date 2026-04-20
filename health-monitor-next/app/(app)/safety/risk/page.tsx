"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SafetyRiskSummary } from "@/lib/types/safety";

const chartConfig = {
  avg_risk: {
    label: "Avg risk",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function levelLabel(level: string): string {
  if (level === "LOW") return "Low";
  if (level === "MEDIUM") return "Medium";
  if (level === "HIGH") return "High";
  return level;
}

export default function SafetyRiskPage() {
  const [summary, setSummary] = useState<SafetyRiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/safety/risk");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as SafetyRiskSummary;
      setSummary(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load risk data");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = useMemo(() => {
    if (!summary?.trend?.length) return [];
    return summary.trend.map((t) => ({
      day: t.bucket.slice(5),
      avg_risk: t.avg_risk,
    }));
  }, [summary]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Risk Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aggregate risk score and daily trend from stored safety events.
        </p>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-80 rounded-xl md:col-span-1" />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error} — ensure the FastAPI service and database are available.
        </p>
      )}

      {!loading && summary && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1 border-0 bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-white/90">Risk score</CardTitle>
              <CardDescription className="text-violet-100">
                7-day average (same scale as ingest scoring)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold tracking-tight">{summary.risk_score.toFixed(1)}</div>
              <p className="mt-4 text-lg font-medium text-white">
                Risk level: {levelLabel(summary.risk_level)}
              </p>
              <p className="mt-2 text-sm text-violet-100">
                Compliance rate: {Math.round(summary.compliance_rate)}% · Active (24h):{" "}
                {summary.active_violations}
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Risk trend</CardTitle>
              <CardDescription>Daily average risk score (last 14 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Not enough data for a chart yet. Ingest some events to see trends.
                </p>
              ) : (
                <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
                  <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Line
                      type="monotone"
                      dataKey="avg_risk"
                      stroke="var(--color-avg_risk)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground">
              <div className="flex gap-2 font-medium leading-none text-foreground">
                Rolling daily average
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
