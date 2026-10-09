import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PageDesignShell } from "../components/public/PageDesignShell";
import { PageSurfaceLayout } from "../components/public/PageSurfaceLayout";
import {
  PAGE_TEMPLATE_KEYS,
  PAGE_TEMPLATE_PICKER_KEYS,
  PAGE_THEME_PRESET_KEYS,
  allSurfaceBlocks,
  applyPageTemplateLayout,
  designWithThemePreset,
  legacyPageDesign,
  movePageDesignBlock,
  pageGridPlacements,
  resetPageGridBreakpoint,
  statusPageDesignSchema,
  sameStatusPageDesign,
  templateDesign,
  updatePageGridPlacement,
} from "../lib/page-design";
import { COMPONENT_STATUS_COLOR } from "../lib/status";

describe("status page design", () => {
  it("exposes the exact published version rendered by a public surface", () => {
    const html = renderToStaticMarkup(
      PageDesignShell({
        pageId: "page-1",
        publishedVersion: 12,
        design: templateDesign("CENTERED_SUMMARY"),
        language: "en",
        children: "Public content",
      })
    );

    expect(html).toContain('data-published-version="12"');
    expect(html).toContain('data-template="CENTERED_SUMMARY"');
  });

  it("ships a valid design for every curated template", () => {
    expect(PAGE_TEMPLATE_KEYS).toHaveLength(8);
    expect(PAGE_TEMPLATE_KEYS).toContain("BANNER_SPOTLIGHT");
    for (const key of PAGE_TEMPLATE_KEYS) {
      const design = templateDesign(key, "#123456");
      expect(statusPageDesignSchema.parse(design).templateKey).toBe(key);
      expect(design.theme.palette.brand).toBe("#123456");
    }
  });

  it("places the operational sections in order across every built-in status template", () => {
    for (const key of PAGE_TEMPLATE_KEYS) {
      const design = templateDesign(key);
      for (const breakpoint of ["desktop", "tablet", "mobile"] as const) {
        const columns = breakpoint === "desktop" ? 12 : breakpoint === "tablet" ? 8 : 4;
        const placements = pageGridPlacements(design, "status", breakpoint);
        const orderedBlocks = [...placements]
          .sort((left, right) => left.order - right.order)
          .map((placement) => allSurfaceBlocks(design, "status").find((block) => block.id === placement.blockId))
          .filter((block) => block?.type === "ACTIVE_INCIDENTS" || block?.type === "SCHEDULED_MAINTENANCE");

        expect(orderedBlocks.map((block) => block?.type)).toEqual(["ACTIVE_INCIDENTS", "SCHEDULED_MAINTENANCE"]);
        expect(orderedBlocks.every((block) =>
          placements.find((placement) => placement.blockId === block?.id)?.column === 1
          && placements.find((placement) => placement.blockId === block?.id)?.span === columns
        )).toBe(true);
        expect(allSurfaceBlocks(design, "status").some((block) => block.type === "HISTORY_PREVIEW")).toBe(false);
      }
    }
  });

  it("keeps active maintenance near the top after active incidents regardless of saved grid order", () => {
    const design = templateDesign("CENTERED_SUMMARY");
    design.surfaces.status.grid.desktop.reverse().forEach((placement, order) => {
      placement.order = order;
    });
    const html = renderToStaticMarkup(
      PageSurfaceLayout({
        design,
        surface: "status",
        renderBlock: (block) => block.id,
      })
    );
    const renderedTypes = [...html.matchAll(/data-page-block="([^"]+)"/g)].map((match) => match[1]);

    expect(renderedTypes.indexOf("ACTIVE_INCIDENTS")).toBeLessThan(renderedTypes.indexOf("SCHEDULED_MAINTENANCE"));
    expect(renderedTypes.indexOf("SCHEDULED_MAINTENANCE")).toBeLessThan(renderedTypes.indexOf("COMPONENT_STATUS"));
  });

  it("omits legacy history previews from status layouts while preserving hub history previews", () => {
    const statusDesign = templateDesign("CENTERED_SUMMARY");
    statusDesign.surfaces.status.primary.push({
      id: "legacy-history-preview",
      type: "HISTORY_PREVIEW",
      hidden: false,
      settings: { heading: "Past maintenance", days: 14 },
    });
    const statusMarkup = renderToStaticMarkup(
      PageSurfaceLayout({
        design: statusDesign,
        surface: "status",
        renderBlock: (block) => block.id,
      })
    );
    const hubDesign = templateDesign("CENTERED_SUMMARY");
    hubDesign.surfaces.hub.primary.push({
      id: "hub-history-preview",
      type: "HISTORY_PREVIEW",
      hidden: false,
      settings: { heading: "Past incidents", days: 14 },
    });
    const hubMarkup = renderToStaticMarkup(
      PageSurfaceLayout({
        design: applyPageTemplateLayout(hubDesign, hubDesign.templateKey),
        surface: "hub",
        renderBlock: (block) => block.id,
      })
    );

    expect(statusMarkup).not.toContain('data-page-block="HISTORY_PREVIEW"');
    expect(hubMarkup).toContain('data-page-block="HISTORY_PREVIEW"');
  });

  it("keeps the editor picker focused on distinct template starting points", () => {
    expect(PAGE_TEMPLATE_PICKER_KEYS).toEqual([
      "CENTERED_SUMMARY",
      "UPTIME_TIMELINE",
      "ILLUSTRATED_HERO",
      "GROUPED_DIRECTORY",
      "PRODUCT_GRID",
      "DENSE_OPERATIONS",
    ]);
  });

  it("normalizes legacy zone designs into schema-v2 responsive placements", () => {
    const legacy = structuredClone(templateDesign("CENTERED_SUMMARY")) as unknown as Record<string, unknown>;
    legacy.schemaVersion = 1;
    const surfaces = legacy.surfaces as Record<string, Record<string, unknown>>;
    for (const surface of Object.values(surfaces)) delete surface.grid;
    delete legacy.presentation;

    const migrated = statusPageDesignSchema.parse(legacy);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.surfaces.status.grid.desktop).toHaveLength(allSurfaceBlocks(migrated, "status").length);
    expect(migrated.surfaces.status.grid.tablet).toBeNull();
  });

  it("inherits smaller breakpoints until they are explicitly edited", () => {
    const design = templateDesign("CENTERED_SUMMARY");
    const block = allSurfaceBlocks(design, "status")[0];
    const inherited = pageGridPlacements(design, "status", "mobile").find((placement) => placement.blockId === block.id);
    expect(inherited?.span).toBe(4);

    const customized = updatePageGridPlacement(design, "status", "mobile", block.id, { span: 2 });
    expect(customized.surfaces.status.grid.mobile).not.toBeNull();
    expect(pageGridPlacements(customized, "status", "mobile").find((placement) => placement.blockId === block.id)?.span).toBe(2);
    expect(resetPageGridBreakpoint(customized, "status", "mobile").surfaces.status.grid.mobile).toBeNull();
  });

  it("applies starting points without replacing blocks, settings, or presentation", () => {
    const design = templateDesign("CENTERED_SUMMARY");
    design.presentation.supportUrl = "https://status.example.com/help";
    const component = allSurfaceBlocks(design, "status").find((block) => block.type === "COMPONENT_STATUS");
    if (component?.type === "COMPONENT_STATUS") component.settings.searchEnabled = true;
    const ids = allSurfaceBlocks(design, "status").map((block) => block.id);

    const applied = applyPageTemplateLayout(design, "PRODUCT_GRID");
    expect(allSurfaceBlocks(applied, "status").map((block) => block.id)).toEqual(ids);
    const appliedComponent = allSurfaceBlocks(applied, "status").find((block) => block.type === "COMPONENT_STATUS");
    expect(appliedComponent?.type === "COMPONENT_STATUS" && appliedComponent.settings.searchEnabled).toBe(true);
    expect(applied.presentation.supportUrl).toBe("https://status.example.com/help");
  });

  it("changes how the public page looks when a simple layout is chosen", () => {
    const standard = templateDesign("CENTERED_SUMMARY");
    const banner = applyPageTemplateLayout(standard, "ILLUSTRATED_HERO");
    expect(banner.chrome.header.variant).toBe("HERO");
    expect(banner.theme.density).toBe("SPACIOUS");
    const compact = applyPageTemplateLayout(banner, "DENSE_OPERATIONS");
    expect(compact.theme.density).toBe("COMPACT");
    expect(compact.theme.contentWidth).toBe("WIDE");
    const services = allSurfaceBlocks(compact, "status").find((block) => block.type === "COMPONENT_STATUS");
    expect(services?.type === "COMPONENT_STATUS" && services.settings.view).toBe("CARDS");
    expect(applyPageTemplateLayout(compact, "CENTERED_SUMMARY").chrome.header.variant).toBe("CENTERED");
  });

  it("keeps the layout's density and width when a style preset is chosen", () => {
    const compact = applyPageTemplateLayout(templateDesign("CENTERED_SUMMARY"), "DENSE_OPERATIONS");
    const themed = designWithThemePreset(compact, "OCEAN");
    expect(themed.theme.density).toBe("COMPACT");
    expect(themed.theme.contentWidth).toBe("WIDE");
  });

  it("builds the uptime timeline composition used by the live public page", () => {
    const design = templateDesign("UPTIME_TIMELINE");
    const components = design.surfaces.status.primary.find((block) => block.type === "COMPONENT_STATUS");

    expect(design.templateKey).toBe("UPTIME_TIMELINE");
    expect(components?.type).toBe("COMPONENT_STATUS");
    expect(components?.type === "COMPONENT_STATUS" && components.settings.view).toBe("UPTIME");
    expect(components?.type === "COMPONENT_STATUS" && components.settings.showUptime).toBe(true);
  });

  it("ships twelve valid theme presets including the default", () => {
    expect(PAGE_THEME_PRESET_KEYS).toHaveLength(12);
    expect(PAGE_THEME_PRESET_KEYS).toContain("DEFAULT");
    for (const key of PAGE_THEME_PRESET_KEYS) {
      const themed = designWithThemePreset(templateDesign("CENTERED_SUMMARY"), key);
      expect(statusPageDesignSchema.safeParse(themed).success).toBe(true);
      expect(themed.theme.palette.operational).toBe(COMPONENT_STATUS_COLOR.OPERATIONAL);
      expect(themed.theme.palette.degraded).toBe(COMPONENT_STATUS_COLOR.DEGRADED_PERFORMANCE);
      expect(themed.theme.palette.partialOutage).toBe(COMPONENT_STATUS_COLOR.PARTIAL_OUTAGE);
      expect(themed.theme.palette.majorOutage).toBe(COMPONENT_STATUS_COLOR.MAJOR_OUTAGE);
      expect(themed.theme.palette.maintenance).toBe(COMPONENT_STATUS_COLOR.UNDER_MAINTENANCE);
    }
  });

  it("maps retired dark-mode fields in stored designs to the light-only schema", () => {
    const stored = JSON.parse(JSON.stringify(templateDesign("CENTERED_SUMMARY"))) as { theme: Record<string, unknown>; chrome: { header: { items: unknown[] } } };
    stored.theme.preset = "MIDNIGHT";
    stored.theme.mode = "DARK";
    stored.theme.allowVisitorMode = true;
    stored.theme.darkPalette = { background: "#070b14", surface: "#111827", text: "#f8fafc", mutedText: "#a9b4c5" };
    stored.chrome.header.items.push({ id: "header-theme", type: "THEME_TOGGLE", hidden: false });

    const parsed = statusPageDesignSchema.parse(stored);

    expect(parsed.theme.preset).toBe("DEFAULT");
    expect(parsed.theme).not.toHaveProperty("mode");
    expect(parsed.theme).not.toHaveProperty("darkPalette");
    expect(parsed.chrome.header.items.some((item) => (item.type as string) === "THEME_TOGGLE")).toBe(false);
  });

  it("detects unchanged normalized drafts before publishing a new version", () => {
    const published = templateDesign("CENTERED_SUMMARY");
    const draft = structuredClone(published);
    expect(sameStatusPageDesign(draft, published)).toBe(true);
    draft.theme.radius = "LARGE";
    expect(sameStatusPageDesign(draft, published)).toBe(false);
  });

  it("reorders composition blocks within a zone", () => {
    const design = templateDesign("CENTERED_SUMMARY");
    const [first, second] = design.surfaces.status.primary;
    const moved = movePageDesignBlock(design, "status", first.id, second.id);

    expect(moved?.design.surfaces.status.primary.slice(0, 2).map((block) => block.id)).toEqual([second.id, first.id]);
    expect(design.surfaces.status.primary[0].id).toBe(first.id);
  });

  it("moves composition blocks between zones", () => {
    const design = templateDesign("CENTERED_SUMMARY");
    const component = design.surfaces.status.primary.find((block) => block.type === "COMPONENT_STATUS");
    expect(component).toBeDefined();
    if (!component) return;

    const moved = movePageDesignBlock(design, "status", component.id, "zone-sidebar");

    expect(moved?.targetZone).toBe("sidebar");
    expect(moved?.design.surfaces.status.primary.some((block) => block.id === component.id)).toBe(false);
    expect(moved?.design.surfaces.status.sidebar.at(-1)?.id).toBe(component.id);
  });

  it("allows every status-page block to move into every layout zone", () => {
    const design = templateDesign("CENTERED_SUMMARY");
    const blocks = allSurfaceBlocks(design, "status");

    for (const block of blocks) {
      for (const zone of ["full", "primary", "sidebar"] as const) {
        const current = allSurfaceBlocks(design, "status")
          .find((candidate) => candidate.id === block.id);
        expect(current).toBeDefined();
        const sourceZone = (["full", "primary", "sidebar"] as const)
          .find((zone) => design.surfaces.status[zone].some((candidate) => candidate.id === block.id));
        if (sourceZone === zone) continue;
        const moved = movePageDesignBlock(design, "status", block.id, `zone-${zone}`);
        expect(moved?.targetZone).toBe(zone);
        if (moved) Object.assign(design, moved.design);
      }
    }
  });

  it("defaults older saved designs to the compatible component directory layout", () => {
    const design = templateDesign("CENTERED_SUMMARY");
    const components = design.surfaces.status.primary.find(
      (block) => block.type === "COMPONENT_STATUS"
    );
    expect(components?.type).toBe("COMPONENT_STATUS");
    if (components?.type !== "COMPONENT_STATUS") return;

    const olderSettings = { ...components.settings } as Partial<typeof components.settings>;
    delete olderSettings.uptimeStyle;
    delete olderSettings.uptimeSize;
    delete olderSettings.uptimeIcon;
    delete olderSettings.groupingEnabled;
    delete olderSettings.componentStyle;
    delete olderSettings.componentColumns;
    delete olderSettings.showSummary;
    components.settings = olderSettings as typeof components.settings;

    const parsed = statusPageDesignSchema.parse(design);
    const parsedComponents = parsed.surfaces.status.primary.find(
      (block) => block.type === "COMPONENT_STATUS"
    );
    expect(parsedComponents?.type).toBe("COMPONENT_STATUS");
    if (parsedComponents?.type !== "COMPONENT_STATUS") return;
    expect(parsedComponents.settings.uptimeStyle).toBe("ROUNDED");
    expect(parsedComponents.settings.uptimeSize).toBe("RESPONSIVE");
    expect(parsedComponents.settings.uptimeIcon).toBe("NONE");
    expect(parsedComponents.settings.groupingEnabled).toBe(false);
    expect(parsedComponents.settings.componentStyle).toBe("ROWS");
    expect(parsedComponents.settings.componentColumns).toBe(3);
    expect(parsedComponents.settings.showSummary).toBe(false);
  });

  it("allows every composition block to be removed from a draft", () => {
    const design = templateDesign("CENTERED_SUMMARY");
    design.surfaces.status.primary = design.surfaces.status.primary.filter(
      (block) => block.type !== "COMPONENT_STATUS"
    );
    const result = statusPageDesignSchema.safeParse(design);
    expect(result.success).toBe(true);
  });

  it("maps existing layouts and themes", () => {
    const cover = legacyPageDesign({
      layout: "COVER",
      brandColor: "#abcdef",
      themePreset: "CALM",
    });
    expect(cover.templateKey).toBe("ILLUSTRATED_HERO");
    expect(cover.theme.palette.brand).toBe("#abcdef");
    expect(cover.theme.palette.background).toBe("#f7f7f4");
  });

  it("rejects executable or malformed portable design content", () => {
    const design = templateDesign("MINIMAL_ENTERPRISE");
    design.chrome.header.links = [{ label: "Unsafe", url: "javascript:alert(1)" }];
    expect(statusPageDesignSchema.safeParse(design).success).toBe(false);
  });

  it("keeps repeated block types independent across public surfaces", () => {
    const design = templateDesign("CENTERED_SUMMARY");
    const statusOverall = design.surfaces.status.full.find((block) => block.type === "OVERALL_STATUS");
    const hubOverall = design.surfaces.hub.full.find((block) => block.type === "OVERALL_STATUS");
    expect(statusOverall?.id).not.toBe(hubOverall?.id);
    if (statusOverall?.type === "OVERALL_STATUS") statusOverall.settings.style = "SOLID";
    expect(hubOverall?.type === "OVERALL_STATUS" && hubOverall.settings.style).toBe("PANEL");
  });

  it("includes announcements on the hub surface by default", () => {
    const design = templateDesign("CENTERED_SUMMARY");
    expect(design.surfaces.hub.full.some((block) => block.type === "ANNOUNCEMENTS")).toBe(true);
  });

});
