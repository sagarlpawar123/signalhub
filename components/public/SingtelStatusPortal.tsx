import { safeUrl } from "@/lib/url";
import type { ReactNode } from "react";
import Image from "next/image";
import { Bell, Headphones, Check, TriangleAlert, X, Wrench, CalendarDays, ArrowRight, Activity, BookOpen, History, Radio } from "lucide-react";
import { PortalServiceTable, type PortalService } from "./PortalServiceTable";
import { formatPageDate } from "@/lib/page-locale";
import { overallBanner, pageHealthStatus, INCIDENT_STATUS_LABEL, MAINTENANCE_STATUS_LABEL, type IncidentStatus, type MaintenanceStatus } from "@/lib/status";
import type { IncidentRow } from "./IncidentTimeline";
import styles from "./SingtelStatusPortal.module.css";

type Props = {
  page: { name: string; logoUrl: string | null; supportUrl: string | null; termsUrl: string | null; privacyUrl: string | null; coverImageUrl: string | null; language: string; timezone: string; removeBranding: boolean };
  basePath: string; services: PortalService[]; incidents: IncidentRow[]; updatedAt: Date; now: Date;
  subscribe: ReactNode; announcements: ReactNode; extras: ReactNode; quickLinks: { label: string; url: string; description: string }[];
};

export function SingtelStatusPortal({ page, basePath, services, incidents, updatedAt, now, subscribe, announcements, extras, quickLinks }: Props) {
  const supportUrl = safeUrl(page.supportUrl);
  const termsUrl = safeUrl(page.termsUrl);
  const privacyUrl = safeUrl(page.privacyUrl);
  const active = incidents.filter((incident) => !incident.isMaintenance && incident.status !== "RESOLVED");
  const maintenance = incidents.filter((incident) => incident.isMaintenance && (incident.maintenanceStatus === "IN_PROGRESS" || incident.maintenanceStatus === "VERIFYING" || (incident.maintenanceStatus === "SCHEDULED" && incident.scheduledStart && (incident.scheduledEnd ?? incident.scheduledStart).getTime() >= now.getTime()))).sort((a, b) => (a.scheduledStart ?? a.createdAt).getTime() - (b.scheduledStart ?? b.createdAt).getTime());
  const health = pageHealthStatus({ componentStatuses: services.map((service) => service.status), activeIncidentImpacts: active.map((incident) => incident.impact), maintenanceActive: maintenance.some((incident) => incident.maintenanceStatus === "IN_PROGRESS" || incident.maintenanceStatus === "VERIFYING"), downMonitorStatuses: [] });
  const healthLabel = health ? overallBanner([health]).label : "Awaiting service data";
  const cards = [
    { label: "Operational", detail: "Services", count: services.filter((s) => s.status === "OPERATIONAL").length, icon: Check, tone: "green" },
    { label: "Degraded", detail: "Services", count: services.filter((s) => s.status === "DEGRADED_PERFORMANCE").length, icon: TriangleAlert, tone: "amber" },
    { label: "Outage", detail: "Services", count: services.filter((s) => s.status === "PARTIAL_OUTAGE" || s.status === "MAJOR_OUTAGE").length, icon: X, tone: "red" },
    { label: "Planned", detail: "Maintenance windows", count: maintenance.filter((i) => i.maintenanceStatus === "SCHEDULED").length, icon: Wrench, tone: "blue" },
  ];
  const date = (value: Date) => formatPageDate(value, { language: page.language, timeZone: page.timezone, dateStyle: "medium", timeStyle: "short" });
  const historyUrl = `${basePath}/history`;
  function incidentPanel(items: IncidentRow[], isMaintenance: boolean) {
    return <section className={styles.panel} id={isMaintenance ? "maintenance" : "incidents"}>
      <div className={styles.panelHeading}><h2>{isMaintenance ? "Upcoming & active maintenance" : "Active Incidents"}</h2><a href={historyUrl}>View history <ArrowRight size={14} /></a></div>
      {items.length ? items.map((incident) => <a className={styles.incident} key={incident.id} href={`${basePath}/incidents/${incident.id}`}>
        <span className={styles.incidentIcon} data-tone={isMaintenance ? "blue" : "amber"}>{isMaintenance ? <CalendarDays size={20} /> : <TriangleAlert size={20} />}</span>
        <div><h3>{incident.name}</h3><p>{isMaintenance && incident.scheduledStart ? date(incident.scheduledStart) : `Started: ${date(incident.createdAt)}`}{isMaintenance && incident.scheduledEnd ? ` – ${date(incident.scheduledEnd)}` : ""}</p><span className={styles.badge} data-tone={isMaintenance ? "blue" : "amber"}>{isMaintenance ? MAINTENANCE_STATUS_LABEL[(incident.maintenanceStatus ?? "SCHEDULED") as MaintenanceStatus] : INCIDENT_STATUS_LABEL[incident.status as IncidentStatus]}</span></div>
      </a>) : <div className={styles.empty}><Check size={23} /><p>{isMaintenance ? "No upcoming maintenance scheduled." : "No active incidents. Your services are looking good."}</p></div>}
    </section>;
  }
  const links = quickLinks.length ? quickLinks : [
    { label: "Service directory", description: "Browse monitored services", url: "#services" },
    { label: "Incident history", description: "Review previous updates", url: historyUrl },
    { label: "Maintenance", description: "See planned work", url: "#maintenance" },
  ];
  return <div className={styles.portal}>
    <header className={styles.header}><a href={basePath} className={styles.identity}>{page.logoUrl ? <Image src={page.logoUrl} alt={page.name} width={112} height={52} unoptimized className={styles.logo} /> : <span className={styles.wordmark}>Singtel<span aria-hidden="true">••••</span></span>}<div><h1>IT Service Status Portal</h1><p>Real-time status of IT services and systems</p></div></a><nav aria-label="Page actions"><span className={styles.subscribe}><Bell size={17} />{subscribe}</span>{supportUrl && <a href={supportUrl}><Headphones size={18} />Contact Support</a>}</nav></header>
    <section className={styles.hero} aria-label="Overall service health">
      {page.coverImageUrl && <Image src={page.coverImageUrl} alt="" fill unoptimized className={styles.cover} />}
      <div className={styles.heroContent}><div className={styles.heroIntro}><span className={styles.eyebrow}><Radio size={14} /> LIVE SERVICE HEALTH</span><h2>{healthLabel}</h2><p>{services.length ? `${services.length} monitored services. The latest availability and incident updates, in one place.` : "Published services will appear here once configured."}</p><div className={styles.updated}><Activity size={16} /><span>Last status change: {date(updatedAt)} · {page.timezone}</span></div></div><div className={styles.summary}>{cards.map(({ icon: Icon, ...card }) => <div key={card.label} className={styles.summaryCard}><div className={styles.summaryValue} data-tone={card.tone}><span><Icon size={26} /></span><strong>{card.count}</strong></div><h3>{card.label}</h3><p>{card.detail}</p></div>)}</div></div>
    </section>
    <main className={styles.main}>{announcements}<div className={styles.columns}><PortalServiceTable services={services} /><aside className={styles.sidebar}>{incidentPanel(active, false)}{incidentPanel(maintenance, true)}</aside></div>{extras}
      <div className={styles.bottom}><section className={styles.bottomPanel}><Headphones size={23} /><h2>Need a helping hand?</h2><p>{supportUrl ? "Raise a request or report an issue with our support team." : "Check incident updates for the latest service information."}</p><a className={styles.primaryButton} href={supportUrl || historyUrl}>{supportUrl ? "Contact Support" : "View incident history"}<ArrowRight size={15} /></a></section>
        <section className={styles.bottomPanel}><h2>Quick Links</h2><div className={styles.quickLinks}>{links.map((link, index) => { const Icon = [BookOpen, History, CalendarDays][index % 3]; return <a key={`${link.url}-${index}`} href={safeUrl(link.url) ?? "#services"}><span><Icon size={22} /></span><div><strong>{link.label}</strong><p>{link.description}</p></div></a>; })}</div></section>
        <section className={styles.bottomPanel}><Bell size={23} /><h2>Stay informed</h2><p>Subscribe for service incident and maintenance updates.</p><span className={styles.subscribe}>{subscribe}</span></section></div>
    </main><footer className={styles.footer}><span>© {now.getFullYear()} {page.name}. All rights reserved.</span><div>{termsUrl && <a href={termsUrl}>Terms of Use</a>}{privacyUrl && <a href={privacyUrl}>Privacy Policy</a>}{!page.removeBranding && <a href="https://signalhub.at">Powered by SignalHub</a>}</div></footer>
  </div>;
}
