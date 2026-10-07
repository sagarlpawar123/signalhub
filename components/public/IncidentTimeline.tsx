import Link from "next/link";
import {
  IMPACT_COLOR,
  IMPACT_LABEL,
  INCIDENT_STATUS_COLOR,
  INCIDENT_STATUS_LABEL,
  MAINTENANCE_STATUS_LABEL,
  type Impact,
  type IncidentStatus,
  type MaintenanceStatus,
} from "@/lib/status";
import { formatPageDate, pageDateKey } from "@/lib/page-locale";

type IncidentUpdateRow = { id: string; status: string; body: string; createdAt: Date; editedAt?: Date | null };

/** Public timelines disclose edits so a changed update is never silent. */
function EditedNote({ editedAt, locale, timeZone }: { editedAt?: Date | null; locale: string; timeZone: string }) {
  if (!editedAt) return null;
  return (
    <span className="ml-2 text-xs italic text-[var(--fg-dim)]">
      (edited <time dateTime={editedAt.toISOString()}>{fmt(editedAt, locale, timeZone)}</time>)
    </span>
  );
}
export type IncidentRow = {
  id: string;
  name: string;
  status: string;
  impact: string;
  isMaintenance: boolean;
  maintenanceStatus: string | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  createdAt: Date;
  resolvedAt: Date | null;
  postmortemPublishedAt: Date | null;
  postmortemBody?: string | null;
  updates: IncidentUpdateRow[];
  components: { component: { name: string } }[];
  linkSlug?: string;
};

function fmt(d: Date, locale: string, timeZone: string) {
  return formatPageDate(d, {
    language: locale,
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function exactTimestamp(d: Date, locale: string, timeZone: string) {
  return formatPageDate(d, {
    language: locale,
    timeZone,
    dateStyle: "medium",
    timeStyle: "long",
  });
}

function relativeTimestamp(d: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1_000));
  if (seconds < 60) return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function IncidentCard({
  incident,
  pageSlug,
  linkPermalink = true,
  locale = "en",
  timeZone = "UTC",
}: {
  incident: IncidentRow;
  pageSlug: string;
  linkPermalink?: boolean;
  locale?: string;
  timeZone?: string;
}) {
  const incidentBasePath = incident.linkSlug ? `/${incident.linkSlug}` : pageSlug ? `/${pageSlug}` : "";
  const impact = incident.impact as Impact;
  const isActive = incident.isMaintenance
    ? incident.maintenanceStatus === "IN_PROGRESS" || incident.maintenanceStatus === "VERIFYING"
    : incident.status !== "RESOLVED";
  const color = isActive ? "var(--amber)" : incident.isMaintenance ? "var(--blue)" : IMPACT_COLOR[impact];
  const statusColor = incident.isMaintenance
    ? isActive ? "var(--amber)" : "var(--blue)"
    : INCIDENT_STATUS_COLOR[incident.status as IncidentStatus];
  const label = incident.isMaintenance
    ? MAINTENANCE_STATUS_LABEL[(incident.maintenanceStatus as MaintenanceStatus) ?? "SCHEDULED"]
    : INCIDENT_STATUS_LABEL[incident.status as IncidentStatus];
  const detailedTimeline = !linkPermalink;
  const decoratedUpdates = incident.updates.map((update, index) => ({
    ...update,
    displayStatus:
      !incident.isMaintenance && index > 0 && incident.updates[index - 1]?.status === update.status
        ? "Updated"
        : incident.isMaintenance
          ? label
          : INCIDENT_STATUS_LABEL[update.status as IncidentStatus],
    displayColor: incident.isMaintenance
      ? "var(--amber)"
      : !incident.isMaintenance && index > 0 && incident.updates[index - 1]?.status === update.status
        ? "var(--blue)"
        : INCIDENT_STATUS_COLOR[update.status as IncidentStatus],
  }));

  return (
    <div
      className={`public-incident-card border border-[var(--line)] border-l-2 p-5 ${isActive ? "bg-[var(--amber-soft)]" : "bg-[var(--surface)]"}`}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h3 className="font-mono font-semibold text-sm text-[var(--fg)]">
          {linkPermalink ? (
            <Link href={`${incidentBasePath}/incidents/${incident.id}`} className="hover:underline underline-offset-2">
              {incident.name}
            </Link>
          ) : (
            incident.name
          )}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-incident-status={incident.isMaintenance ? incident.maintenanceStatus : incident.status}
            className="text-xs font-mono font-medium px-2.5 py-1 shrink-0 border"
            style={{
              color: statusColor,
              borderColor: statusColor,
              backgroundColor: incident.isMaintenance
                ? isActive ? "var(--amber-soft)" : "var(--blue-soft)"
                : `color-mix(in srgb, ${statusColor} 12%, transparent)`,
            }}
          >
            {label}
          </span>
          {!incident.isMaintenance && (
            <span
              className="text-xs font-mono font-medium px-2.5 py-1 shrink-0 border"
              style={{ color: IMPACT_COLOR[impact], borderColor: IMPACT_COLOR[impact], backgroundColor: "color-mix(in srgb, " + IMPACT_COLOR[impact] + " 12%, transparent)" }}
            >
              {IMPACT_LABEL[impact]}
            </span>
          )}
        </div>
      </div>
      {incident.components.length > 0 && (
        <p className="text-xs text-[var(--fg-dim)] mt-1.5">Affects: {incident.components.map((c) => c.component.name).join(", ")}</p>
      )}
      {incident.isMaintenance && incident.scheduledStart && (
        <p className="text-xs font-mono text-[var(--fg-soft)] mt-1.5">
          Window: {fmt(incident.scheduledStart, locale, timeZone)} — {incident.scheduledEnd ? fmt(incident.scheduledEnd, locale, timeZone) : "TBD"}
        </p>
      )}
      {detailedTimeline ? (
        <section className="mt-8" data-incident-timeline="detailed">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-[var(--fg)]">Timeline</h2>
          <ol className="relative">
            {[...decoratedUpdates].reverse().map((update, index, updates) => (
              <li key={update.id} className={`relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 ${index < updates.length - 1 ? "pb-10" : ""}`}>
                {index < updates.length - 1 && (
                  <span aria-hidden="true" className="absolute bottom-0 left-[0.95rem] top-8 w-px bg-[var(--line)]" />
                )}
                <span
                  aria-hidden="true"
                  className={`relative z-10 mt-1.5 h-8 w-8 rounded-full border-4 border-[var(--surface)] ${index === 0 ? "bg-[var(--page-brand)]" : "bg-[var(--line)]"}`}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg font-semibold" style={{ color: update.displayColor }}>{update.displayStatus}</h3>
                    <span className="text-sm text-[var(--fg-soft)]">{relativeTimestamp(update.createdAt)}</span>
                  </div>
                  <time className="mt-1 inline-block text-sm text-[var(--fg)]" dateTime={update.createdAt.toISOString()}>
                    {exactTimestamp(update.createdAt, locale, timeZone)}
                  </time>
                  <EditedNote editedAt={update.editedAt} locale={locale} timeZone={timeZone} />
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--fg)]">{update.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <div className="mt-4 space-y-4 border-l-2 border-[var(--line)] pl-4">
          {decoratedUpdates.map((update) => (
            <div key={update.id} className="text-sm">
              <span className="font-medium" style={{ color: update.displayColor }}>{update.displayStatus}</span>
              <span className="ml-2 font-mono text-xs text-[var(--fg-dim)]">{fmt(update.createdAt, locale, timeZone)}</span>
              <EditedNote editedAt={update.editedAt} locale={locale} timeZone={timeZone} />
              <p className="mt-1 whitespace-pre-wrap leading-relaxed text-[var(--fg-soft)]">{update.body}</p>
            </div>
          ))}
        </div>
      )}
      {incident.postmortemPublishedAt && incident.postmortemBody && (
        <Link
          href={`${incidentBasePath}/incidents/${incident.id}`}
          className="inline-block mt-4 text-xs text-[var(--cyan)] underline underline-offset-2 hover:opacity-80"
        >
          Read postmortem
        </Link>
      )}
    </div>
  );
}

type IncidentsByDayProps = {
  incidents: IncidentRow[];
  pageSlug: string;
  days?: number;
  locale?: string;
  timeZone?: string;
};

function IncidentsByDay({
  incidents,
  pageSlug,
  days = 14,
  locale = "en",
  timeZone = "UTC",
}: IncidentsByDayProps) {
  const buckets: { date: string; label: string; incidents: IncidentRow[] }[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = pageDateKey(d, timeZone);
    const incidentsForDate = incidents.filter((incident) => pageDateKey(incident.createdAt, timeZone) === key);
    if (incidentsForDate.length === 0) continue;
    buckets.push({
      date: key,
      label: formatPageDate(d, {
        language: locale,
        timeZone,
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      incidents: incidentsForDate,
    });
  }

  if (!buckets.length) {
    return (
      <p className="page-panel border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-5 text-sm text-[var(--fg-soft)]">
        No incidents reported in the past {days} {days === 1 ? "day" : "days"}.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {buckets.map((b) => (
        <div key={b.date}>
          <h4 className="text-sm font-mono font-semibold text-[var(--fg-soft)] mb-2.5">{b.label}</h4>
          <div className="space-y-3">
            {b.incidents.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                pageSlug={pageSlug}
                locale={locale}
                timeZone={timeZone}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PastIncidentsByDay(props: IncidentsByDayProps) {
  return <IncidentsByDay {...props} />;
}

export function PastMaintenanceByDay({ incidents, ...props }: IncidentsByDayProps) {
  const completedMaintenance = incidents.filter(
    (incident) => incident.isMaintenance && incident.maintenanceStatus === "COMPLETED"
  );
  return <IncidentsByDay {...props} incidents={completedMaintenance} />;
}
