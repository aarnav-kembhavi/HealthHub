"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types/safety";

function levelLabel(level: RiskLevel): string {
  switch (level) {
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    default:
      return level;
  }
}

const riskCardClass: Record<RiskLevel, string> = {
  LOW: "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
  MEDIUM: "bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
  HIGH: "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
};

interface SafetyStatCardsProps {
  activeViolations: number;
  complianceRate: number;
  riskLevel: RiskLevel;
}

export function SafetyStatCards({ activeViolations, complianceRate, riskLevel }: SafetyStatCardsProps) {
  const items = [
    {
      title: "Active Violations",
      value: String(activeViolations),
      description: "Recorded in the last 24 hours",
      icon: <AlertTriangle />,
      cardClassName: "bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
    },
    {
      title: "Compliance Rate",
      value: `${Math.round(complianceRate)}%`,
      description: "Based on 7-day average risk",
      icon: <CheckCircle2 />,
      cardClassName: "bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700",
    },
    {
      title: "Risk Level",
      value: levelLabel(riskLevel),
      description: "From recent aggregate scoring",
      icon: <ShieldAlert />,
      cardClassName: riskCardClass[riskLevel] ?? riskCardClass.MEDIUM,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((stat) => (
        <Card
          key={stat.title}
          className={cn(
            "shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-[1.02] border-0",
            stat.cardClassName
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-white">{stat.title}</CardTitle>
            <div className="p-2 rounded-lg bg-white/20">
              {React.cloneElement(stat.icon, {
                className: cn("h-5 w-5 text-white/90"),
              })}
            </div>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            <p className="text-xs text-white/80 pt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
