"use client";

import { useCallback, useEffect, useState } from "react";
import { SafetyStatCards } from "../components/safety-stat-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SafetyRiskSummary } from "@/lib/types/safety";

const PPE_BASE = process.env.NEXT_PUBLIC_PPE_SERVICE_URL || "http://127.0.0.1:5000";
const STREAM_URL = `${PPE_BASE.replace(/\/$/, "")}/video_feed`;

export default function SafetyLivePage() {
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
      setError(e instanceof Error ? e.message : "Could not load safety metrics");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Real-Time Safety Monitoring</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live camera feed from the PPE detection service. Metrics refresh every 30 seconds.
        </p>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}
      {!loading && summary && (
        <SafetyStatCards
          activeViolations={summary.active_violations}
          complianceRate={summary.compliance_rate}
          riskLevel={summary.risk_level}
        />
      )}
      {!loading && error && (
        <p className="text-sm text-destructive">
          {error} — ensure the API is running and the database is configured for safety events.
        </p>
      )}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Live stream</CardTitle>
          <CardDescription>
            Stream: <code className="text-xs">{STREAM_URL}</code>
            {" · "}
            The PPE server now auto-starts the camera when this page loads (restart Flask if you still see black).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full bg-black aspect-video overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- MJPEG multipart stream; next/image does not support it */}
            <img
              src={STREAM_URL}
              alt="Live PPE camera stream"
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
