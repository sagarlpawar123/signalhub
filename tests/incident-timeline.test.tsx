import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IncidentCard, PastMaintenanceByDay, type IncidentRow } from "../components/public/IncidentTimeline";

describe("past maintenance timeline", () => {
  it("renders only completed maintenance and dates that contain it", () => {
    const now = new Date();
    const maintenance: IncidentRow = {
      id: "maintenance-1",
      name: "Database upgrade",
      status: "RESOLVED",
      impact: "NONE",
      isMaintenance: true,
      maintenanceStatus: "COMPLETED",
      scheduledStart: null,
      scheduledEnd: null,
      createdAt: now,
      resolvedAt: now,
      postmortemPublishedAt: null,
      updates: [],
      components: [],
    };
    const resolvedIncident: IncidentRow = {
      ...maintenance,
      id: "incident-1",
      name: "Resolved outage",
      isMaintenance: false,
      maintenanceStatus: null,
    };
    const activeMaintenance: IncidentRow = {
      ...maintenance,
      id: "maintenance-2",
      name: "Ongoing maintenance",
      maintenanceStatus: "IN_PROGRESS",
    };

    const html = renderToStaticMarkup(
      <PastMaintenanceByDay
        incidents={[maintenance, resolvedIncident, activeMaintenance]}
        pageSlug="demo"
        days={14}
        timeZone="UTC"
      />
    );

    expect(html).toContain("Database upgrade");
    expect(html).not.toContain("Resolved outage");
    expect(html).not.toContain("Ongoing maintenance");
    expect(html.match(/<h4/g)).toHaveLength(1);
  });

  it("renders incident details as a newest-first rail with repeated statuses labelled as updates", () => {
    const incident: IncidentRow = {
      id: "incident-2",
      name: "Dashboard outage",
      status: "RESOLVED",
      impact: "MAJOR",
      isMaintenance: false,
      maintenanceStatus: null,
      scheduledStart: null,
      scheduledEnd: null,
      createdAt: new Date("2026-07-25T00:00:00Z"),
      resolvedAt: new Date("2026-07-25T03:00:00Z"),
      postmortemPublishedAt: null,
      updates: [
        { id: "one", status: "INVESTIGATING", body: "Investigating", createdAt: new Date("2026-07-25T01:00:00Z") },
        { id: "two", status: "IDENTIFIED", body: "Identified", createdAt: new Date("2026-07-25T01:30:00Z") },
        { id: "three", status: "MONITORING", body: "Monitoring", createdAt: new Date("2026-07-25T02:00:00Z") },
        { id: "four", status: "MONITORING", body: "Monitoring continues", createdAt: new Date("2026-07-25T02:30:00Z") },
        { id: "five", status: "RESOLVED", body: "Resolved", createdAt: new Date("2026-07-25T03:00:00Z") },
      ],
      components: [],
    };

    const html = renderToStaticMarkup(
      <IncidentCard incident={incident} pageSlug="demo" linkPermalink={false} timeZone="UTC" />
    );

    expect(html).toContain('data-incident-timeline="detailed"');
    expect(html).toContain('data-incident-status="RESOLVED"');
    expect(html).toContain("color:var(--red)");
    expect(html).toContain("color:var(--blue)");
    expect(html).toContain("color:var(--amber)");
    expect(html).toContain("color:var(--orange)");
    expect(html).toContain("color:var(--green)");
    expect(html.indexOf("Resolved")).toBeLessThan(html.indexOf("Updated"));
    expect(html.indexOf("Updated")).toBeLessThan(html.lastIndexOf("Investigating"));
    expect(html).toContain("rounded-full");
  });

  it("highlights active incidents and maintenance with amber", () => {
    const now = new Date();
    const activeIncident = renderToStaticMarkup(
      <IncidentCard
        incident={{
          id: "incident-active",
          name: "API latency",
          status: "INVESTIGATING",
          impact: "MAJOR",
          isMaintenance: false,
          maintenanceStatus: null,
          scheduledStart: null,
          scheduledEnd: null,
          createdAt: now,
          resolvedAt: null,
          postmortemPublishedAt: null,
          updates: [],
          components: [],
        }}
        pageSlug="demo"
        timeZone="UTC"
      />
    );

    const activeMaintenance = renderToStaticMarkup(
      <IncidentCard
        incident={{
          id: "maintenance-active",
          name: "Database upgrade",
          status: "INVESTIGATING",
          impact: "NONE",
          isMaintenance: true,
          maintenanceStatus: "IN_PROGRESS",
          scheduledStart: now,
          scheduledEnd: null,
          createdAt: now,
          resolvedAt: null,
          postmortemPublishedAt: null,
          updates: [],
          components: [],
        }}
        pageSlug="demo"
        timeZone="UTC"
      />
    );

    for (const html of [activeIncident, activeMaintenance]) {
      expect(html).toContain("bg-[var(--amber-soft)]");
      expect(html).toContain("border-left-color:var(--amber)");
    }
    expect(activeIncident).toContain('data-incident-status="INVESTIGATING"');
    expect(activeMaintenance).toContain('data-incident-status="IN_PROGRESS"');
  });
});
