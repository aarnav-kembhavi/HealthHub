"""
Industrial safety (PPE) events: ingest, list, and aggregate risk metrics.
Uses the same PostgreSQL credentials as the rest of the API.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import create_engine, text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/safety", tags=["safety"])

RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]


class SafetyIngestRequest(BaseModel):
    person_id: int
    no_helmet: bool = False
    no_vest: bool = False
    no_mask: bool = False
    duration: float = 0.0
    timestamp: str
    snapshot_url: Optional[str] = None


class SafetyIngestResponse(BaseModel):
    risk_score: float
    risk_level: RiskLevel


class SafetyEventOut(BaseModel):
    id: int
    timestamp: str
    person_id: int
    violation_type: str
    duration: float
    risk_score: float
    snapshot_url: Optional[str] = None


class RiskTrendPoint(BaseModel):
    bucket: str
    avg_risk: float


class SafetyRiskSummary(BaseModel):
    risk_score: float
    risk_level: RiskLevel
    compliance_rate: float
    active_violations: int
    trend: list[RiskTrendPoint]


def _postgres_url_optional() -> Optional[str]:
    """Build Postgres URL from env without raising (for startup when DB_* may be unset)."""
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME")
    if not user or not password or not host or not name:
        return None
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


def _engine_url() -> str:
    url = _postgres_url_optional()
    if not url:
        raise HTTPException(
            status_code=503,
            detail="Database is not configured (set DB_USER, DB_PASSWORD, DB_HOST, DB_NAME).",
        )
    return url


def init_safety_schema() -> None:
    """Create safety_events if missing. Safe to call on startup."""
    try:
        url = _postgres_url_optional()
        if not url:
            logger.warning("Safety schema init skipped: DB env not set.")
            return
        engine = create_engine(url)
        statements = [
            """
            CREATE TABLE IF NOT EXISTS safety_events (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMPTZ NOT NULL,
                person_id INTEGER NOT NULL,
                violation_type VARCHAR(64) NOT NULL,
                duration DOUBLE PRECISION NOT NULL DEFAULT 0,
                risk_score DOUBLE PRECISION NOT NULL,
                snapshot_url TEXT
            )
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_safety_events_timestamp
            ON safety_events (timestamp DESC)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_safety_events_person
            ON safety_events (person_id)
            """,
        ]
        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st.strip()))
        logger.info("Safety schema ready (safety_events).")
    except Exception as e:
        logger.exception("Failed to init safety schema: %s", e)


def compute_risk_score(no_helmet: bool, no_vest: bool, no_mask: bool, duration: float) -> tuple[float, RiskLevel]:
    score = 0.0
    if no_helmet:
        score += 5.0
    if no_vest:
        score += 3.0
    if no_mask:
        score += 2.0
    if duration > 3.0:
        score *= 1.5
    score = round(score, 2)
    if score < 5.0:
        level: RiskLevel = "LOW"
    elif score < 12.0:
        level = "MEDIUM"
    else:
        level = "HIGH"
    return score, level


def _parse_ts(raw: str) -> datetime:
    try:
        ts = raw.replace("Z", "+00:00")
        dt = datetime.fromisoformat(ts)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid timestamp: {e}") from e


VIOLATION_CODES = (
    ("NO_HELMET", lambda r: r.no_helmet),
    ("NO_VEST", lambda r: r.no_vest),
    ("NO_MASK", lambda r: r.no_mask),
)


@router.post("/ingest", response_model=SafetyIngestResponse)
async def ingest_event(body: SafetyIngestRequest) -> SafetyIngestResponse:
    risk_score, risk_level = compute_risk_score(
        body.no_helmet, body.no_vest, body.no_mask, body.duration
    )
    violations = [code for code, pred in VIOLATION_CODES if pred(body)]
    if not violations:
        return SafetyIngestResponse(risk_score=risk_score, risk_level=risk_level)

    ts = _parse_ts(body.timestamp)
    engine = create_engine(_engine_url())
    insert_sql = text(
        """
        INSERT INTO safety_events (timestamp, person_id, violation_type, duration, risk_score, snapshot_url)
        VALUES (:timestamp, :person_id, :violation_type, :duration, :risk_score, :snapshot_url)
        """
    )
    with engine.begin() as conn:
        for vtype in violations:
            conn.execute(
                insert_sql,
                {
                    "timestamp": ts,
                    "person_id": body.person_id,
                    "violation_type": vtype,
                    "duration": float(body.duration),
                    "risk_score": risk_score,
                    "snapshot_url": body.snapshot_url,
                },
            )
    return SafetyIngestResponse(risk_score=risk_score, risk_level=risk_level)


@router.get("/events", response_model=list[SafetyEventOut])
async def list_events(limit: int = Query(100, ge=1, le=500)) -> list[SafetyEventOut]:
    if _postgres_url_optional() is None:
        return []
    engine = create_engine(_engine_url())
    q = text(
        """
        SELECT id, timestamp, person_id, violation_type, duration, risk_score, snapshot_url
        FROM safety_events
        ORDER BY timestamp DESC
        LIMIT :limit
        """
    )
    with engine.connect() as conn:
        rows = conn.execute(q, {"limit": limit}).mappings().all()
    out: list[SafetyEventOut] = []
    for row in rows:
        ts = row["timestamp"]
        ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        out.append(
            SafetyEventOut(
                id=row["id"],
                timestamp=ts_str,
                person_id=row["person_id"],
                violation_type=row["violation_type"],
                duration=float(row["duration"]),
                risk_score=float(row["risk_score"]),
                snapshot_url=row["snapshot_url"],
            )
        )
    return out


@router.get("/risk", response_model=SafetyRiskSummary)
async def get_risk_summary() -> SafetyRiskSummary:
    if _postgres_url_optional() is None:
        return SafetyRiskSummary(
            risk_score=0.0,
            risk_level="LOW",
            compliance_rate=100.0,
            active_violations=0,
            trend=[],
        )
    engine = create_engine(_engine_url())
    with engine.connect() as conn:
        avg_row = conn.execute(
            text(
                """
                SELECT COALESCE(AVG(risk_score), 0) AS avg_risk
                FROM safety_events
                WHERE timestamp > NOW() - INTERVAL '7 days'
                """
            )
        ).mappings().first()
        active_row = conn.execute(
            text(
                """
                SELECT COUNT(*)::int AS c
                FROM safety_events
                WHERE timestamp > NOW() - INTERVAL '24 hours'
                """
            )
        ).mappings().first()
        trend_rows = conn.execute(
            text(
                """
                SELECT
                    to_char(date_trunc('day', timestamp), 'YYYY-MM-DD') AS bucket,
                    AVG(risk_score)::float AS avg_risk
                FROM safety_events
                WHERE timestamp > NOW() - INTERVAL '14 days'
                GROUP BY date_trunc('day', timestamp)
                ORDER BY date_trunc('day', timestamp) ASC
                """
            )
        ).mappings().all()

    avg_risk = float(avg_row["avg_risk"] if avg_row else 0.0)
    if avg_risk < 5.0:
        risk_level: RiskLevel = "LOW"
    elif avg_risk < 12.0:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    # Compliance: scale average risk (typical max ~15–22) down to 0–100
    compliance_rate = round(max(0.0, min(100.0, 100.0 - (avg_risk / 22.0) * 100.0)), 1)
    active_violations = int(active_row["c"] if active_row else 0)

    trend = [
        RiskTrendPoint(bucket=str(r["bucket"]), avg_risk=round(float(r["avg_risk"]), 2))
        for r in trend_rows
    ]

    return SafetyRiskSummary(
        risk_score=round(avg_risk, 2),
        risk_level=risk_level,
        compliance_rate=compliance_rate,
        active_violations=active_violations,
        trend=trend,
    )
