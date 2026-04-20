"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SafetyEvent } from "@/lib/types/safety";

function formatViolationType(v: string): string {
  return v.replace(/^NO_/i, "No ").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function SafetyLogsPage() {
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/safety/events?limit=200");
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as SafetyEvent[];
        if (!cancelled) {
          setEvents(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load events");
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">PPE Violations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Recent events ingested from the safety API (manual posts or external detectors).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Violation log</CardTitle>
          <CardDescription>Timestamp, type, person, duration, and snapshot when available.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && events.length === 0 && (
            <p className="text-sm text-muted-foreground">No events yet. POST to /safety/ingest to record violations.</p>
          )}
          {!loading && events.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Violation type</TableHead>
                  <TableHead>Person ID</TableHead>
                  <TableHead>Duration (s)</TableHead>
                  <TableHead className="w-[120px]">Snapshot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(row.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{formatViolationType(row.violation_type)}</TableCell>
                    <TableCell>{row.person_id}</TableCell>
                    <TableCell>{row.duration.toFixed(2)}</TableCell>
                    <TableCell>
                      {row.snapshot_url ? (
                        <a
                          href={row.snapshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-14 w-20 overflow-hidden rounded border bg-muted"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.snapshot_url}
                            alt="Violation snapshot"
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
