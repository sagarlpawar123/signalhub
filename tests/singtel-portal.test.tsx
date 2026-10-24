import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SingtelStatusPortal } from "../components/public/SingtelStatusPortal";
import type { IncidentRow } from "../components/public/IncidentTimeline";

const now = new Date("2026-10-24T10:00:00Z");
const incident = (overrides: Partial<IncidentRow>): IncidentRow => ({
  id: "incident-1", name: "Network incident", status: "INVESTIGATING", impact: "MINOR", isMaintenance: false, maintenanceStatus: null, scheduledStart: null, scheduledEnd: null, createdAt: now, resolvedAt: null, postmortemPublishedAt: null, updates: [], components: [], ...overrides,
});
function render(incidents: IncidentRow[] = [], supportUrl: string | null = null) {
  return renderToStaticMarkup(<SingtelStatusPortal
    page={{ name: "Singtel", logoUrl: null, supportUrl, termsUrl: null, privacyUrl: null, coverImageUrl: null, language: "en", timezone: "Asia/Singapore", removeBranding: false }}
    basePath="/singtel-status" services={[]} incidents={incidents} updatedAt={now} now={now}
    subscribe={<button>Subscribe</button>} announcements={null} extras={null} quickLinks={[]}
  />);
}
describe("Singtel portal public information", () => {
  it("shows real empty states instead of claiming operational health without services", () => {
    const html = render();
    expect(html).toContain("Awaiting service data");
    expect(html).not.toContain("All Systems Operational");
    expect(html).toContain("No services have been published yet.");
    expect(html).toContain("No upcoming maintenance scheduled.");
  });
  it("includes scheduled and active maintenance while excluding completed and expired windows", () => {
    const html = render([
      incident({ id: "future", name: "Future window", isMaintenance: true, maintenanceStatus: "SCHEDULED", scheduledStart: new Date("2026-10-25T10:00:00Z") }),
      incident({ id: "active", name: "Active window", isMaintenance: true, maintenanceStatus: "IN_PROGRESS" }),
      incident({ id: "done", name: "Completed window", isMaintenance: true, maintenanceStatus: "COMPLETED" }),
      incident({ id: "expired", name: "Expired window", isMaintenance: true, maintenanceStatus: "SCHEDULED", scheduledStart: new Date("2026-10-23T10:00:00Z") }),
      incident({ id: "resolved", name: "Resolved incident", status: "RESOLVED" }),
    ]);
    expect(html).toContain("Future window");
    expect(html).toContain("Active window");
    expect(html).not.toContain("Completed window");
    expect(html).not.toContain("Expired window");
    expect(html).not.toContain("Resolved incident");
    expect(html).toContain('href="/singtel-status/incidents/future"');
  });
  it("reflects active incident severity even when no services are published", () => {
    const html = render([incident({ impact: "CRITICAL" })]);
    expect(html).toContain("Major System Outage");
    expect(html).not.toContain("Awaiting service data");
  });
  it("rejects unsafe configured support URLs", () => {
    const html = render([], "javascript:alert(1)");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("Contact Support");
  });
});
