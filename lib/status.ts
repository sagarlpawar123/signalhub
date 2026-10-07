export const COMPONENT_STATUSES = [
  "OPERATIONAL",
  "DEGRADED_PERFORMANCE",
  "PARTIAL_OUTAGE",
  "MAJOR_OUTAGE",
  "UNDER_MAINTENANCE",
] as const;

export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];

export const INCIDENT_STATUSES = ["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const MAINTENANCE_STATUSES = ["SCHEDULED", "IN_PROGRESS", "VERIFYING", "COMPLETED"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const IMPACTS = ["NONE", "MINOR", "MAJOR", "CRITICAL"] as const;
export type Impact = (typeof IMPACTS)[number];

export const COMPONENT_STATUS_LABEL: Record<ComponentStatus, string> = {
  OPERATIONAL: "Operational",
  DEGRADED_PERFORMANCE: "Degraded Performance",
  PARTIAL_OUTAGE: "Partial Outage",
  MAJOR_OUTAGE: "Major Outage",
  UNDER_MAINTENANCE: "Under Maintenance",
};

/** Badge tone for each component status in the console. */
export const COMPONENT_STATUS_TONE: Record<ComponentStatus, "ok" | "warn" | "danger" | "info"> = {
  OPERATIONAL: "ok",
  DEGRADED_PERFORMANCE: "warn",
  PARTIAL_OUTAGE: "warn",
  MAJOR_OUTAGE: "danger",
  UNDER_MAINTENANCE: "info",
};

export const COMPONENT_STATUS_COLOR: Record<ComponentStatus, string> = {
  OPERATIONAL: "#16a34a",
  DEGRADED_PERFORMANCE: "#eab308",
  PARTIAL_OUTAGE: "#f97316",
  MAJOR_OUTAGE: "#dc2626",
  UNDER_MAINTENANCE: "#3b82f6",
};

// Higher = worse. Used to compute the "worst" status across components/days.
const SEVERITY_RANK: Record<ComponentStatus, number> = {
  OPERATIONAL: 0,
  UNDER_MAINTENANCE: 1,
  DEGRADED_PERFORMANCE: 2,
  PARTIAL_OUTAGE: 3,
  MAJOR_OUTAGE: 4,
};

function isComponentStatus(value: string): value is ComponentStatus {
  return COMPONENT_STATUSES.includes(value as ComponentStatus);
}

export function worstStatus(statuses: ComponentStatus[]): ComponentStatus {
  if (statuses.length === 0) return "OPERATIONAL";
  return statuses.reduce((worst, s) => (SEVERITY_RANK[s] > SEVERITY_RANK[worst] ? s : worst), "OPERATIONAL" as ComponentStatus);
}

const INCIDENT_IMPACT_STATUS: Record<string, ComponentStatus> = {
  NONE: "OPERATIONAL",
  MINOR: "DEGRADED_PERFORMANCE",
  MAJOR: "PARTIAL_OUTAGE",
  CRITICAL: "MAJOR_OUTAGE",
};

export type PageHealthSignals = {
  componentStatuses: string[];
  activeIncidentImpacts: string[];
  maintenanceActive: boolean;
  downMonitorStatuses: string[];
  hasHealthyMonitor?: boolean;
};

/**
 * Summarize the signals that can materially affect a page. A null result means
 * the page has no observed component, incident, maintenance, or monitor state;
 * callers must not present that as an operational page.
 */
export function pageHealthStatus(signals: PageHealthSignals): ComponentStatus | null {
  const statuses = signals.componentStatuses.filter(isComponentStatus);

  for (const impact of signals.activeIncidentImpacts) {
    statuses.push(INCIDENT_IMPACT_STATUS[impact] ?? "DEGRADED_PERFORMANCE");
  }
  if (signals.maintenanceActive) statuses.push("UNDER_MAINTENANCE");
  for (const status of signals.downMonitorStatuses) {
    statuses.push(isComponentStatus(status) ? status : "MAJOR_OUTAGE");
  }
  if (signals.hasHealthyMonitor) statuses.push("OPERATIONAL");

  return statuses.length ? worstStatus(statuses) : null;
}

export function overallBanner(statuses: ComponentStatus[]): { label: string; color: string; status: ComponentStatus } {
  const worst = worstStatus(statuses);
  if (worst === "OPERATIONAL") {
    return { label: "All Systems Operational", color: COMPONENT_STATUS_COLOR.OPERATIONAL, status: worst };
  }
  if (worst === "UNDER_MAINTENANCE") {
    return { label: "Maintenance In Progress", color: COMPONENT_STATUS_COLOR.UNDER_MAINTENANCE, status: worst };
  }
  const labels: Partial<Record<ComponentStatus, string>> = {
    DEGRADED_PERFORMANCE: "Degraded Performance",
    PARTIAL_OUTAGE: "Partial System Outage",
    MAJOR_OUTAGE: "Major System Outage",
  };
  return { label: labels[worst] ?? "Service Disruption", color: COMPONENT_STATUS_COLOR[worst], status: worst };
}

export const IMPACT_COLOR: Record<Impact, string> = {
  NONE: "#5c6773",
  MINOR: "#eab308",
  MAJOR: "#f97316",
  CRITICAL: "#dc2626",
};

export const IMPACT_LABEL: Record<Impact, string> = {
  NONE: "No Impact",
  MINOR: "Minor Outage",
  MAJOR: "Major Outage",
  CRITICAL: "Critical Outage",
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  INVESTIGATING: "Investigating",
  IDENTIFIED: "Identified",
  MONITORING: "Monitoring",
  RESOLVED: "Resolved",
};

export const INCIDENT_STATUS_COLOR: Record<IncidentStatus, string> = {
  INVESTIGATING: "var(--red)",
  IDENTIFIED: "var(--amber)",
  MONITORING: "var(--orange)",
  RESOLVED: "var(--green)",
};

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  VERIFYING: "Verifying",
  COMPLETED: "Completed",
};

/**
 * Compute per-day uptime percentage buckets from a list of status events.
 * Maintenance windows are excluded from downtime math per spec.
 */
export type DailyUptimeBucket = {
  date: string;
  status: ComponentStatus;
  uptimePct: number | null;
  observedMs: number;
  details: Array<{
    status: ComponentStatus;
    note: string | null;
    startedAt: Date;
    endedAt: Date;
    durationMs: number;
  }>;
};

export function computeDailyUptime(
  events: { status: string; startedAt: Date; endedAt: Date | null; isMaintenance: boolean; note?: string | null }[],
  days: number,
  now = new Date(),
  observationStart?: Date
): DailyUptimeBucket[] {
  const result: DailyUptimeBucket[] = [];
  const safeObservationStart =
    observationStart && Number.isFinite(observationStart.getTime()) ? observationStart : null;

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    dayStart.setUTCDate(dayStart.getUTCDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const effectiveDayEnd = dayEnd > now ? now : dayEnd;
    const effectiveDayStart =
      safeObservationStart && safeObservationStart > dayStart ? safeObservationStart : dayStart;
    const observedMs = Math.max(0, effectiveDayEnd.getTime() - effectiveDayStart.getTime());

    if (observedMs === 0) {
      result.push({
        date: dayStart.toISOString().slice(0, 10),
        status: "OPERATIONAL",
        uptimePct: null,
        observedMs: 0,
        details: [],
      });
      continue;
    }

    const outageIntervals: { start: number; end: number }[] = [];
    const details: DailyUptimeBucket["details"] = [];
    let worst: ComponentStatus = "OPERATIONAL";

    for (const ev of events) {
      const evStart = ev.startedAt < effectiveDayStart ? effectiveDayStart : ev.startedAt;
      const evEnd = (ev.endedAt ?? now) > effectiveDayEnd ? effectiveDayEnd : ev.endedAt ?? now;
      if (evEnd <= evStart) continue;
      const eventStatus = isComponentStatus(ev.status) ? ev.status : "OPERATIONAL";
      if (eventStatus !== "OPERATIONAL" || ev.note?.trim()) {
        details.push({
          status: eventStatus,
          note: ev.note?.trim() || null,
          startedAt: evStart,
          endedAt: evEnd,
          durationMs: evEnd.getTime() - evStart.getTime(),
        });
      }
      if (ev.isMaintenance || eventStatus === "OPERATIONAL") continue;
      outageIntervals.push({ start: evStart.getTime(), end: evEnd.getTime() });
      const s = eventStatus;
      if (isComponentStatus(s) && SEVERITY_RANK[s] > SEVERITY_RANK[worst]) worst = s;
    }

    outageIntervals.sort((a, b) => a.start - b.start || a.end - b.end);
    let downMs = 0;
    let mergedStart: number | null = null;
    let mergedEnd: number | null = null;
    for (const interval of outageIntervals) {
      if (mergedStart === null || mergedEnd === null) {
        mergedStart = interval.start;
        mergedEnd = interval.end;
      } else if (interval.start <= mergedEnd) {
        mergedEnd = Math.max(mergedEnd, interval.end);
      } else {
        downMs += mergedEnd - mergedStart;
        mergedStart = interval.start;
        mergedEnd = interval.end;
      }
    }
    if (mergedStart !== null && mergedEnd !== null) downMs += mergedEnd - mergedStart;

    const uptimePct = Math.max(0, 100 - (downMs / observedMs) * 100);

    result.push({
      date: dayStart.toISOString().slice(0, 10),
      status: worst,
      uptimePct,
      observedMs,
      details: details.sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime()),
    });
  }

  return result;
}

export function weightedUptime(buckets: DailyUptimeBucket[]): number | null {
  const observedMs = buckets.reduce((total, bucket) => total + bucket.observedMs, 0);
  if (!observedMs) return null;

  const upMs = buckets.reduce(
    (total, bucket) =>
      total + (bucket.uptimePct === null ? 0 : (bucket.uptimePct / 100) * bucket.observedMs),
    0
  );
  return Math.max(0, Math.min(100, (upMs / observedMs) * 100));
}

export function metricDecimals(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10) return 0;
  return value;
}

export function formatMetricValue(value: number, decimals: number | null | undefined) {
  return value.toFixed(metricDecimals(decimals));
}
