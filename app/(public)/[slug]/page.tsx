import { SingtelStatusPortal } from "@/components/public/SingtelStatusPortal";
import { notFound, redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/access";
import { getComponentsForPage, getIncidentsForPage, getMetricsForPage, splitActiveAndPast } from "@/lib/public-data";
import { PublicHeader, PublicFooter } from "@/components/public/PublicChrome";
import { StatusBanner } from "@/components/public/StatusBanner";
import { ComponentList } from "@/components/public/ComponentList";
import { SubscribeModal } from "@/components/public/SubscribeModal";
import { IncidentCard } from "@/components/public/IncidentTimeline";
import { MetricChart } from "@/components/public/MetricChart";
import { getMetricInsights } from "@/lib/metric-series";
import { scopeCustomCss } from "@/lib/custom-css";
import { publicPagePath } from "@/lib/public-path";
import { PublicAnalytics } from "@/components/public/PublicAnalytics";
import { ActiveStatusIndicator } from "@/components/public/ActiveStatusIndicator";
import type { Metadata } from "next";
import { pageDesignFor, type PageDesignBlock } from "@/lib/page-design";
import { PageDesignShell } from "@/components/public/PageDesignShell";
import { PageSurfaceLayout } from "@/components/public/PageSurfaceLayout";
import { AnnouncementList } from "@/components/public/AnnouncementList";
import { publicFaviconMetadata } from "@/lib/public-favicon";
import { getActivePageAnnouncements, getPublicPageById, getPublicPageBySlug } from "@/lib/pages";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPageBySlug(slug);
  if (!page) return {};
  const design = pageDesignFor(page);
  return {
    title: design.seo.title || `${page.name} — ${page.headline || "Service status"}`,
    description: design.seo.description || page.aboutText || `Current availability and incident history for ${page.name}.`,
    openGraph: design.seo.socialImageUrl ? { images: [design.seo.socialImageUrl] } : undefined,
    ...publicFaviconMetadata(page.faviconUrl),
    robots: page.type === "PUBLIC" && !page.noindex && !design.seo.noIndex ? undefined : { index: false, follow: false },
  };
}

export default async function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageDoc = await getPublicPageBySlug(slug);
  if (!pageDoc) notFound();
  if (pageDoc.isHub) redirect(`/hub/${encodeURIComponent(pageDoc.slug)}`);
  const hubParent = pageDoc.hubParentId ? await getPublicPageById(pageDoc.hubParentId) : null;
  const page = { ...pageDoc, hubParent };
  const design = pageDesignFor(pageDoc);
  const basePath = publicPagePath(page);

  const access = await checkPageAccess(page);
  if (!access.ok) {
    if (access.reason === "unavailable") notFound();
    redirect(`${basePath}/access`);
  }

  const { groups, ungrouped, banner } = await getComponentsForPage(page.id, access.visibleComponentIds);
  const incidents = await getIncidentsForPage(page.id, access.visibleComponentIds);
  const { active } = splitActiveAndPast(incidents);
  const activeIncidents = active.filter((i) => !i.isMaintenance);
  const activeMaintenance = active.filter((i) => i.isMaintenance);

  const metrics = await getMetricsForPage(page.id, access.visibleComponentIds);
  const metricInsights = await getMetricInsights(metrics.map((metric) => metric.id));
  const now = new Date();
  const announcementDocs = await getActivePageAnnouncements(page.id, "STATUS", now);
  const announcements = announcementDocs.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    severity: announcement.severity,
    ctaLabel: announcement.ctaLabel,
    ctaUrl: announcement.ctaUrl,
    dismissible: announcement.dismissible,
  }));
  const scopedCss = scopeCustomCss(page.customCss, page.id);
  const incidentPageSlug = basePath ? page.slug : "";

  const allComponentsFlat = [...groups.flatMap((g) => g.components), ...ungrouped];
  const activityDates = [
    ...allComponentsFlat.flatMap((component) => component.statusEvents.map((event) => new Date(event.startedAt))),
    ...incidents.flatMap((incident) => incident.updates.map((update) => new Date(update.createdAt))),
  ];
  const lastActivity = activityDates.length
    ? new Date(Math.max(...activityDates.map((date) => date.getTime())))
    : page.createdAt;

  function renderBlock(block: PageDesignBlock) {
    if (block.hidden) return null;
    switch (block.type) {
      case "OVERALL_STATUS":
        return (
          <StatusBanner
            label={banner.label}
            color={banner.color}
            updatedAt={lastActivity}
            locale={page.language}
            timeZone={page.timezone}
            variant={block.settings.style}
            showLastUpdated={block.settings.showLastUpdated}
            description={block.settings.showDescription ? page.aboutText : null}
          />
        );
      case "ANNOUNCEMENTS":
        return <AnnouncementList pageId={page.id} announcements={announcements} maxItems={block.settings.maxItems} />;
      case "RICH_TEXT":
        return (
            <article className={`public-ops-panel page-panel border border-[var(--line)] bg-[var(--surface)] p-[var(--page-block-padding)] ${block.settings.align === "CENTER" ? "text-center" : ""}`}>
            {block.settings.heading && <h2 className="text-xl font-semibold">{block.settings.heading}</h2>}
            {block.settings.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--fg-soft)]">{block.settings.body}</p>}
          </article>
        );
      case "COMPONENT_STATUS":
        return <ComponentList groups={groups} ungrouped={ungrouped} settings={block.settings} nowIso={now.toISOString()} />;
      case "ACTIVE_INCIDENTS":
        return activeIncidents.length ? (
          <section className="public-ops-section">
            <h2 className="mb-3 flex items-center gap-3 text-lg font-semibold">
              <ActiveStatusIndicator />
              {block.settings.heading}
            </h2>
            <div className="space-y-3">
              {activeIncidents.map((incident) => <IncidentCard key={incident.id} incident={incident} pageSlug={incidentPageSlug} locale={page.language} timeZone={page.timezone} />)}
            </div>
          </section>
        ) : null;
      case "SCHEDULED_MAINTENANCE":
        if (activeMaintenance.length === 0) return null;
        return (
          <section className="public-ops-section">
            <h2 className="mb-3 flex items-center gap-3 text-lg font-semibold">
              <ActiveStatusIndicator />
              {block.settings.heading === "Scheduled maintenance" ? "Active maintenance" : block.settings.heading}
            </h2>
            <div className="space-y-3">
              {activeMaintenance.map((incident) => <IncidentCard key={incident.id} incident={incident} pageSlug={incidentPageSlug} locale={page.language} timeZone={page.timezone} />)}
            </div>
          </section>
        );
      case "METRICS":
        return metrics.length ? (
          <section className="public-ops-section">
            <h2 className="mb-3 text-lg font-semibold">{block.settings.heading}</h2>
            <div className={`grid gap-4 ${block.settings.columns === 2 ? "sm:grid-cols-2" : ""}`}>
              {metrics.map((metric) => (
                <MetricChart
                  key={metric.id}
                  id={metric.id}
                  pageSlug={page.slug}
                  name={metric.name}
                  suffix={metric.suffix}
                  decimals={metric.decimals ?? 0}
                  locale={page.language}
                  timeZone={page.timezone}
                  color={design.theme.palette.brand}
                  insights={metricInsights.get(metric.id)!}
                />
              ))}
            </div>
          </section>
        ) : null;
      case "SUBSCRIBE":
        return (
          <section className={`public-subscribe-block ${block.settings.style === "PANEL" ? "page-panel border border-[var(--line)] bg-[var(--surface)] p-[var(--page-block-padding)]" : ""}`}>
            <div className={block.settings.style === "PANEL" ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" : ""}>
              {block.settings.style !== "BUTTON" && <h2 className={block.settings.style === "PANEL" ? "min-w-0 font-semibold" : "mb-3 font-semibold"}>{block.settings.heading}</h2>}
              <SubscribeModal
                pageSlug={page.slug}
                brandColor={design.theme.palette.brand}
                feedsEnabled={page.type === "PUBLIC"}
                feedBasePath={basePath ? undefined : "/feed"}
                components={allComponentsFlat.map((component) => ({ id: component.id, name: component.name }))}
              />
            </div>
          </section>
        );
      case "LINK_CARDS":
        return block.settings.links.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {block.settings.links.map((link) => (
              <a key={link.url} href={link.url} className="public-ops-panel page-panel border border-[var(--line)] bg-[var(--surface)] p-4 transition-transform hover:-translate-y-0.5">
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

  // This installation's Singtel portal has a dedicated dashboard presentation.
  // Access checks and audience-scoped data above remain shared with other pages.
  if (page.slug === "singtel-status") {
    const blocks = [...design.surfaces.status.full, ...design.surfaces.status.primary, ...design.surfaces.status.sidebar].filter((block) => !block.hidden);
    const categoryById = new Map(groups.flatMap((group) => group.components.map((component) => [component.id, group.name] as const)));
    const quickLinks = blocks.flatMap((block) => block.type === "LINK_CARDS" ? block.settings.links : []);
    return <PageDesignShell pageId={page.id} publishedVersion={page.publishedDesignVersion} design={design} customCss={scopedCss} language={page.language}>
      {page.analyticsEnabled && <PublicAnalytics pageSlug={page.slug} />}
      <SingtelStatusPortal
        page={{ ...page, logoUrl: design.presentation.logoUrl, coverImageUrl: design.presentation.coverImageUrl, supportUrl: design.presentation.supportUrl }}
        basePath={basePath}
        services={allComponentsFlat.map((component) => ({ id: component.id, name: component.name, description: component.description, status: component.status, category: categoryById.get(component.id) ?? "General" }))}
        incidents={incidents} updatedAt={lastActivity} now={now}
        subscribe={<SubscribeModal pageSlug={page.slug} brandColor="#0056df" feedsEnabled={page.type === "PUBLIC"} feedBasePath={basePath ? undefined : "/feed"} components={allComponentsFlat.map((component) => ({ id: component.id, name: component.name }))} />}
        announcements={blocks.filter((block) => block.type === "ANNOUNCEMENTS").map((block) => <div key={block.id} className="mb-4">{renderBlock(block)}</div>)}
        extras={blocks.filter((block) => block.type === "RICH_TEXT" || block.type === "METRICS").map((block) => <div key={block.id} className="mt-4">{renderBlock(block)}</div>)}
        quickLinks={quickLinks}
      />
    </PageDesignShell>;
  }

  return (
    <PageDesignShell pageId={page.id} publishedVersion={page.publishedDesignVersion} design={design} customCss={scopedCss} language={page.language}>
      {page.analyticsEnabled && <PublicAnalytics pageSlug={page.slug} />}
      <PublicHeader
        name={page.name}
        logoUrl={page.logoUrl}
        supportUrl={page.supportUrl}
        hubSlug={page.hubParent?.slug ?? (page.isHub ? page.slug : null)}
        layout={page.layout}
        coverImageUrl={page.coverImageUrl}
        coverImageFit={page.coverImageFit}
        coverImagePositionX={page.coverImagePositionX}
        coverImagePositionY={page.coverImagePositionY}
        coverImageCropX={page.coverImageCropX}
        coverImageCropY={page.coverImageCropY}
        coverImageCropWidth={page.coverImageCropWidth}
        coverImageCropHeight={page.coverImageCropHeight}
        brandColor={page.brandColor}
        design={design}
        subscribeSlot={
          <SubscribeModal
            pageSlug={page.slug}
            brandColor={design.theme.palette.brand}
            feedsEnabled={page.type === "PUBLIC"}
            feedBasePath={basePath ? undefined : "/feed"}
            components={allComponentsFlat.map((component) => ({ id: component.id, name: component.name }))}
          />
        }
      />
      <PageSurfaceLayout
        design={design}
        surface="status"
        renderBlock={renderBlock}
      />
      <PublicFooter removeBranding={page.removeBranding} termsUrl={page.termsUrl} privacyUrl={page.privacyUrl} supportUrl={page.supportUrl} design={design} />
    </PageDesignShell>
  );
}
