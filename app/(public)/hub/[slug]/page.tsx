import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { overallBanner, COMPONENT_STATUS_COLOR } from "@/lib/status";
import { PublicHeader, PublicFooter } from "@/components/public/PublicChrome";
import { ActiveStatusIndicator } from "@/components/public/ActiveStatusIndicator";
import { StatusBanner } from "@/components/public/StatusBanner";
import { SubscribeModal } from "@/components/public/SubscribeModal";
import { IncidentCard, PastIncidentsByDay } from "@/components/public/IncidentTimeline";
import { checkPageAccess } from "@/lib/access";
import { splitActiveAndPast } from "@/lib/public-data";
import { getPublicSurfaceSummary } from "@/lib/public-surface";
import { publicPagePath } from "@/lib/public-path";
import { pageDesignFor } from "@/lib/page-design";
import { PageDesignShell } from "@/components/public/PageDesignShell";
import { scopeCustomCss } from "@/lib/custom-css";
import { PageSurfaceLayout } from "@/components/public/PageSurfaceLayout";
import { AnnouncementList } from "@/components/public/AnnouncementList";
import type { PageDesignBlock } from "@/lib/page-design";
import type { Metadata } from "next";
import { publicFaviconMetadata } from "@/lib/public-favicon";
import { getActivePageAnnouncements, getPublicHubChildren, getPublicPageBySlug } from "@/lib/pages";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hub = await getPublicPageBySlug(slug, { isHub: true });
  if (!hub) return {};
  const design = pageDesignFor(hub);
  return {
    title: design.seo.title || `${hub.name} — Product status`,
    description: design.seo.description || hub.aboutText || `Current availability for ${hub.name}.`,
    openGraph: design.seo.socialImageUrl ? { images: [design.seo.socialImageUrl] } : undefined,
    ...publicFaviconMetadata(hub.faviconUrl),
    robots: hub.type === "PUBLIC" && !hub.noindex && !design.seo.noIndex ? undefined : { index: false, follow: false },
  };
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hubDoc = await getPublicPageBySlug(slug);
  if (!hubDoc || !hubDoc.isHub) notFound();
  const hub = hubDoc!;
  const design = pageDesignFor(hub);
  const hubAccess = await checkPageAccess(hub);
  if (!hubAccess.ok) {
    if (hubAccess.reason === "unavailable") notFound();
    redirect(
      `/${encodeURIComponent(slug)}/access?returnTo=${encodeURIComponent(
        publicPagePath(hub)
      )}`
    );
  }
  const candidateChildren = await getPublicHubChildren(hub.id, hub.orgId);
  const childData = (
    await Promise.all(
      candidateChildren.map(async (child) => {
        const access = await checkPageAccess(child);
        if (!access.ok) return null;
        const summary = await getPublicSurfaceSummary(child.id, access.visibleComponentIds);
        return { child, ...summary };
      })
    )
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const visibleStatuses = childData
    .map((child) => child.banner?.status)
    .filter((status): status is NonNullable<typeof status> => Boolean(status));
  const aggregateBanner = visibleStatuses.length
    ? overallBanner(visibleStatuses)
    : { label: "No current status data", color: "#64748b" };
  const allIncidents = childData
    .flatMap(({ child, incidents }) =>
      incidents.map((incident) => ({
        ...incident,
        name: `[${child.name}] ${incident.name}`,
        linkSlug: child.slug,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const { active, past } = splitActiveAndPast(allIncidents);
  const activeIncidents = active.filter((incident) => !incident.isMaintenance);
  const activeMaintenance = active.filter((incident) => incident.isMaintenance);
  const scheduledMaintenance = allIncidents.filter(
    (incident) => incident.isMaintenance && incident.maintenanceStatus === "SCHEDULED"
  );
  const now = new Date();
  const announcementDocs = await getActivePageAnnouncements(hub.id, "HUB", now);
  const announcements = announcementDocs.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    severity: announcement.severity,
    ctaLabel: announcement.ctaLabel,
    ctaUrl: announcement.ctaUrl,
    dismissible: announcement.dismissible,
  }));
  const hubHasAnnouncementBlock = [
    ...design.surfaces.hub.full,
    ...design.surfaces.hub.primary,
    ...design.surfaces.hub.sidebar,
  ].some((block) => block.type === "ANNOUNCEMENTS");

  function renderBlock(block: PageDesignBlock) {
    switch (block.type) {
      case "OVERALL_STATUS":
        return (
          <StatusBanner
            label={aggregateBanner.label}
            color={aggregateBanner.color}
            locale={hub.language}
            timeZone={hub.timezone}
            variant={block.settings.style}
            showLastUpdated={block.settings.showLastUpdated}
            description={block.settings.showDescription ? hub.aboutText : null}
          />
        );
      case "ANNOUNCEMENTS":
        return <AnnouncementList pageId={hub.id} announcements={announcements} maxItems={block.settings.maxItems} />;
      case "RICH_TEXT":
        return (
          <article className={`page-panel border border-[var(--line)] bg-[var(--surface)] p-[var(--page-block-padding)] ${block.settings.align === "CENTER" ? "text-center" : ""}`}>
            {block.settings.heading && <h2 className="text-xl font-semibold">{block.settings.heading}</h2>}
            {block.settings.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--fg-soft)]">{block.settings.body}</p>}
          </article>
        );
      case "HUB_GRID":
        return (
          <section className={`grid gap-4 ${
            block.settings.columns === 1
              ? ""
              : block.settings.columns === 3
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-2"
          }`}>
            {childData.map(({ child, banner, componentCount }) => (
              <Link
                key={child.id}
                href={publicPagePath(child)}
                className="page-panel flex flex-col gap-2 border border-[var(--line)] bg-[var(--surface)] p-[var(--page-block-padding)] transition-transform hover:-translate-y-0.5 hover:border-[var(--line-bright)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-[var(--fg)]">{child.name}</span>
                  <span className="status-dot rounded-full" style={{ backgroundColor: banner ? COMPONENT_STATUS_COLOR[banner.status] : "#64748b" }} />
                </div>
                <span className="text-sm font-mono" style={{ color: banner?.color ?? "#64748b" }}>
                  {banner?.label ?? "No current status data"}
                </span>
                {block.settings.showDescriptions && child.aboutText && <p className="text-sm text-[var(--fg-soft)]">{child.aboutText}</p>}
                <span className="text-xs text-[var(--fg-dim)]">{componentCount} components</span>
              </Link>
            ))}
            {childData.length === 0 && <p className="text-sm text-[var(--fg-dim)]">No products are available for your current access.</p>}
          </section>
        );
      case "ACTIVE_INCIDENTS":
        return activeIncidents.length ? (
          <section>
            <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold">
              <ActiveStatusIndicator />
              {block.settings.heading}
            </h2>
            <div className="space-y-3">
              {activeIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} pageSlug={hub.slug} locale={hub.language} timeZone={hub.timezone} />
              ))}
            </div>
          </section>
        ) : null;
      case "SCHEDULED_MAINTENANCE":
        return activeMaintenance.length || scheduledMaintenance.length ? (
          <section>
            <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold">
              {activeMaintenance.length > 0 && <ActiveStatusIndicator />}
              {block.settings.heading}
            </h2>
            <div className="space-y-3">
              {[...activeMaintenance, ...scheduledMaintenance].map((incident) => (
                <IncidentCard key={incident.id} incident={incident} pageSlug={hub.slug} locale={hub.language} timeZone={hub.timezone} />
              ))}
            </div>
          </section>
        ) : null;
      case "HISTORY_PREVIEW":
        return (
          <section>
            <h2 className="mb-4 text-lg font-semibold">{block.settings.heading}</h2>
            <PastIncidentsByDay incidents={past} pageSlug={hub.slug} days={block.settings.days} locale={hub.language} timeZone={hub.timezone} />
          </section>
        );
      case "SUBSCRIBE":
        return (
          <section className={block.settings.style === "PANEL" ? "page-panel border border-[var(--line)] bg-[var(--surface)] p-[var(--page-block-padding)]" : ""}>
            <div className={block.settings.style === "PANEL" ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" : ""}>
              {block.settings.style !== "BUTTON" && <h2 className={block.settings.style === "PANEL" ? "min-w-0 font-semibold" : "mb-3 font-semibold"}>{block.settings.heading}</h2>}
              <SubscribeModal pageSlug={hub.slug} brandColor={design.theme.palette.brand} feedsEnabled={hub.type === "PUBLIC"} components={[]} />
            </div>
          </section>
        );
      case "LINK_CARDS":
        return block.settings.links.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {block.settings.links.map((link) => (
              <a key={link.url} href={link.url} className="page-panel border border-[var(--line)] bg-[var(--surface)] p-4 transition-transform hover:-translate-y-0.5">
                <strong>{link.label}</strong>
                {link.description && <p className="mt-1 text-sm text-[var(--fg-soft)]">{link.description}</p>}
              </a>
            ))}
          </div>
        ) : null;
      default:
        return null;
    }
  }

  return (
    <PageDesignShell pageId={hub.id} publishedVersion={hub.publishedDesignVersion} design={design} customCss={scopeCustomCss(hub.customCss, hub.id)} language={hub.language}>
      <PublicHeader
        name={hub.name}
        logoUrl={hub.logoUrl}
        supportUrl={hub.supportUrl}
        layout={hub.layout}
        coverImageUrl={hub.coverImageUrl}
        coverImageFit={hub.coverImageFit}
        coverImagePositionX={hub.coverImagePositionX}
        coverImagePositionY={hub.coverImagePositionY}
        coverImageCropX={hub.coverImageCropX}
        coverImageCropY={hub.coverImageCropY}
        coverImageCropWidth={hub.coverImageCropWidth}
        coverImageCropHeight={hub.coverImageCropHeight}
        brandColor={hub.brandColor}
        design={design}
        subscribeSlot={<SubscribeModal pageSlug={hub.slug} brandColor={design.theme.palette.brand} feedsEnabled={hub.type === "PUBLIC"} components={[]} />}
      />
      <PageSurfaceLayout
        design={design}
        surface="hub"
        intro={(
          <section className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--fg-dim)]">Product status hub</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{hub.headline || hub.name}</h1>
            {hub.aboutText && !design.surfaces.hub.full.some((block) => block.type === "OVERALL_STATUS" && !block.hidden && block.settings.showDescription) && (
              <p className="mt-2 max-w-2xl text-sm text-[var(--fg-soft)]">{hub.aboutText}</p>
            )}
            {!hubHasAnnouncementBlock && announcements.length > 0 && (
              <div className="mt-6">
                <AnnouncementList pageId={hub.id} announcements={announcements} maxItems={3} />
              </div>
            )}
          </section>
        )}
        renderBlock={renderBlock}
      />
      <PublicFooter removeBranding={hub.removeBranding} termsUrl={hub.termsUrl} privacyUrl={hub.privacyUrl} supportUrl={hub.supportUrl} design={design} />
    </PageDesignShell>
  );
}
