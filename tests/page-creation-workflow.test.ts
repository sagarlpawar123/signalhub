import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("unified page creation workflow", () => {
  it("offers one primary page-list entry point and no setup wizard", () => {
    const pageList = source("app/admin/(protected)/pages/page.tsx");
    expect(pageList).toContain('href="/organization/pages/new"');
    expect(pageList).toContain("page.setupCompletedAt === null ? \"Draft\"");
    expect(pageList).toContain("aria-label={`Edit ${page.name}`}");
    expect(pageList).not.toContain("Setup wizard");
    expect(pageList).toContain("Create status page in this hub");
  });

  it("refuses to delete a hub that still has pages, including through bulk delete", () => {
    const actions = source("app/admin/(protected)/pages/actions.ts");
    expect(actions).toContain("before deleting it");
    expect(actions.match(/if \(page\.isHub\) await assertHubEmpty\(/g)).toHaveLength(2);
    expect(actions).toContain('.where("setupCompletedAt", "is not", null)');
  });

  it("creates hidden drafts and only publishes through setup completion", () => {
    const actions = source("app/admin/(protected)/pages/actions.ts");
    expect(actions).toContain("setupCompletedAt: null");
    expect(actions).toContain("publicVisible: false");
    expect(actions).toContain("export async function finishPageSetup");
    expect(actions).toContain("Add at least one visible component");
    expect(actions).toContain("if (!page.isHub)");
    expect(actions).not.toContain("at least one child status page");
  });

  it("keeps hub content and status-page components mutually exclusive", () => {
    const basics = source("components/admin/NewPageBasicsForm.tsx");
    const content = source("app/admin/(protected)/pages/[pageId]/content/page.tsx");
    const componentActions = source("app/admin/(protected)/pages/[pageId]/components-actions.ts");
    expect(basics).toContain('value: "STATUS"');
    expect(basics).toContain('value: "HUB"');
    expect(content).toContain("Status pages in this hub");
    expect(content).toContain("Services always belong to those status pages");
    expect(componentActions).toContain("Services belong to status pages, not hubs");
  });

  it("redirects legacy wizard URLs and noncanonical hub URLs", () => {
    const legacy = source("app/admin/(protected)/pages/[pageId]/setup/[step]/page.tsx");
    const publicPage = source("app/(public)/[slug]/page.tsx");
    expect(legacy).toContain("LegacySetupRedirect");
    expect(legacy).toContain("redirect(`/organization/pages/${pageId}`)");
    expect(publicPage).toContain("if (pageDoc.isHub) redirect(`/hub/${encodeURIComponent(pageDoc.slug)}`)");
  });

  it("separates setup essentials into page-management sections", () => {
    const overview = source("app/admin/(protected)/pages/[pageId]/page.tsx");
    const shell = source("components/admin/PageManagementShell.tsx");
    const appearance = source("app/admin/(protected)/pages/[pageId]/appearance/page.tsx");
    const access = source("app/admin/(protected)/pages/[pageId]/access/page.tsx");
    const notificationsPage = source("app/admin/(protected)/pages/[pageId]/notifications/page.tsx");
    const notifications = source("components/admin/PageNotificationsSection.tsx");
    for (const label of ["Overview", "Content", "Appearance", "Access", "Notifications", "Settings"]) expect(shell).toContain(label);
    expect(overview).not.toContain("Incident readiness");
    expect(overview).toContain("Manage services");
    expect(appearance).toContain("SimpleAppearanceEditor");
    expect(shell).toContain("Services & groups");
    expect(shell).toContain("Status pages");
    expect(access).toContain("Audience-specific access");
    expect(notificationsPage).toContain("PageNotificationsSection");
    expect(notifications).toContain("Subscriber channels");
    expect(notifications).toContain("Team and on-call destinations");
    expect(notifications).toContain("Signed status-event webhooks");
  });

  it("does not show a redundant access section for public pages", () => {
    const shell = source("components/admin/PageManagementShell.tsx");
    const access = source("app/admin/(protected)/pages/[pageId]/access/page.tsx");
    expect(shell).toContain('page.type === "PUBLIC"');
    expect(shell).toContain('section.key !== "access"');
    expect(access).toContain('if (page.type === "PUBLIC") redirect(`/organization/pages/${pageId}`)');
    expect(access).not.toContain("Anyone with the public URL can view this page");
  });

  it("keeps visitor footer links out of general settings", () => {
    const settings = source("app/admin/(protected)/pages/[pageId]/settings/page.tsx");
    const actions = source("app/admin/(protected)/pages/actions.ts");
    expect(settings).not.toContain('name="supportUrl"');
    expect(settings).not.toContain('name="termsUrl"');
    expect(settings).not.toContain('name="privacyUrl"');
    expect(actions).not.toContain('{ $set: { name, headline, aboutText, supportUrl, termsUrl, privacyUrl, timezone');
  });
});
