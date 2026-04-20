export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface SafetyEvent {
  id: number;
  timestamp: string;
  person_id: number;
  violation_type: string;
  duration: number;
  risk_score: number;
  snapshot_url: string | null;
}

export interface SafetyRiskSummary {
  risk_score: number;
  risk_level: RiskLevel;
  compliance_rate: number;
  active_violations: number;
  trend: { bucket: string; avg_risk: number }[];
}
