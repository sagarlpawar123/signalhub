import { z } from "zod";
import { COMPONENT_STATUS_COLOR } from "@/lib/status";

export const PAGE_DESIGN_SCHEMA_VERSION = 2 as const;

export const PAGE_GRID_COLUMNS = {
  desktop: 12,
  tablet: 8,
  mobile: 4,
} as const;
export type PageDesignBreakpoint = keyof typeof PAGE_GRID_COLUMNS;

export const UPTIME_BAR_STYLES = ["ROUNDED", "SQUARE", "PILL", "SOLID"] as const;
export type UptimeBarStyle = (typeof UPTIME_BAR_STYLES)[number];
export const UPTIME_BAR_SIZES = ["RESPONSIVE", "COMPACT", "BLOCKS"] as const;
export type UptimeBarSize = (typeof UPTIME_BAR_SIZES)[number];
export const UPTIME_ICON_STYLES = ["NONE", "DOT", "STATUS"] as const;
export type UptimeIconStyle = (typeof UPTIME_ICON_STYLES)[number];

export const PAGE_THEME_PRESET_KEYS = [
  "DEFAULT",
  "OCEAN",
  "EMERALD",
  "SUNSET",
  "VIOLET",
  "SLATE",
  "HIGH_CONTRAST",
  "WARM_PAPER",
  "SOFT_BLUE",
  "TEAL",
  "ROSE",
  "INDIGO",
] as const;
export type PageThemePresetKey = (typeof PAGE_THEME_PRESET_KEYS)[number];

export const PAGE_THEME_PRESET_LABELS: Record<PageThemePresetKey, string> = {
  DEFAULT: "Default",
  OCEAN: "Ocean",
  EMERALD: "Emerald",
  SUNSET: "Sunset",
  VIOLET: "Violet",
  SLATE: "Slate",
  HIGH_CONTRAST: "High contrast",
  WARM_PAPER: "Warm paper",
  SOFT_BLUE: "Soft blue",
  TEAL: "Teal",
  ROSE: "Rose",
  INDIGO: "Indigo",
};

export const PAGE_THEME_PRESET_DESCRIPTIONS: Record<PageThemePresetKey, string> = {
  DEFAULT: "Balanced neutral styling with the SignalHub teal accent.",
  OCEAN: "Clear blues and cyan accents for infrastructure and network pages.",
  EMERALD: "Calm greens with strong operational-state emphasis.",
  SUNSET: "Warm orange and amber accents with an inviting surface palette.",
  VIOLET: "A modern purple and pink brand treatment with soft backgrounds.",
  SLATE: "Restrained enterprise neutrals with understated elevation.",
  HIGH_CONTRAST: "Maximum text and control contrast with square, flat surfaces.",
  WARM_PAPER: "Soft cream surfaces and earthy accents for a human tone.",
  SOFT_BLUE: "A bright, approachable blue theme with comfortable spacing.",
  TEAL: "Fresh teal accents on a cool, quiet surface.",
  ROSE: "Warm rose accents with soft, rounded cards.",
  INDIGO: "Deep indigo with crisp cards for product teams.",
};

export const PAGE_TEMPLATE_KEYS = [
  "CENTERED_SUMMARY",
  "BANNER_SPOTLIGHT",
  "UPTIME_TIMELINE",
  "ILLUSTRATED_HERO",
  "GROUPED_DIRECTORY",
  "PRODUCT_GRID",
  "DENSE_OPERATIONS",
  "MINIMAL_ENTERPRISE",
] as const;

// Keep every historical template valid for saved designs, but only offer
// clearly distinct starting points in the editor picker.
export const PAGE_TEMPLATE_PICKER_KEYS = [
  "CENTERED_SUMMARY",
  "UPTIME_TIMELINE",
  "ILLUSTRATED_HERO",
  "GROUPED_DIRECTORY",
  "PRODUCT_GRID",
  "DENSE_OPERATIONS",
] as const satisfies readonly PageTemplateKey[];

export const PAGE_DESIGN_VERSION_HISTORY_LIMIT = 30;

export type PageTemplateKey = (typeof PAGE_TEMPLATE_KEYS)[number];

export function sameStatusPageDesign(left: unknown, right: unknown) {
  return JSON.stringify(statusPageDesignSchema.parse(left)) === JSON.stringify(statusPageDesignSchema.parse(right));
}

export const PAGE_TEMPLATE_LABELS: Record<PageTemplateKey, string> = {
  CENTERED_SUMMARY: "Centered summary",
  BANNER_SPOTLIGHT: "Banner spotlight",
  UPTIME_TIMELINE: "Uptime timeline",
  ILLUSTRATED_HERO: "Illustrated hero",
  GROUPED_DIRECTORY: "Grouped directory",
  PRODUCT_GRID: "Product grid",
  DENSE_OPERATIONS: "Dense operations",
  MINIMAL_ENTERPRISE: "Minimal enterprise",
};

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i, "Use a six-digit hex color");
const httpUrl = z.string().url().refine((value) => /^https?:\/\//i.test(value), "Use an HTTP(S) URL");
const imageUrl = z.string().refine(
  (value) => /^https?:\/\//i.test(value) || /^\/api\/assets\/[0-9a-f-]{36}$/i.test(value),
  "Use an HTTP(S) or uploaded asset URL"
);
const visitorUrl = z.string().refine(
  (value) => /^https?:\/\//i.test(value) || /^mailto:/i.test(value),
  "Use an HTTP(S) or email URL"
);
// What visitors can switch between on a public metric chart.
export const METRIC_RANGES = ["24h", "7d", "30d", "90d"] as const;
export const METRIC_LENSES = ["trend", "percentiles", "distribution", "uptime", "responses"] as const;
export const METRIC_VIEWS = ["line", "area", "bar", "step", "scatter", "bands", "gauge", "heatmap"] as const;
export type MetricRange = (typeof METRIC_RANGES)[number];
export type MetricLens = (typeof METRIC_LENSES)[number];
export type MetricView = (typeof METRIC_VIEWS)[number];

const blockId = z.string().min(1).max(80);
const commonBlock = {
  id: blockId,
  hidden: z.boolean().default(false),
};

export const pageDesignBlockSchema = z.discriminatedUnion("type", [
  z.object({
    ...commonBlock,
    type: z.literal("OVERALL_STATUS"),
    settings: z.object({
      style: z.enum(["PANEL", "SOLID", "CENTERED", "COMPACT"]).default("PANEL"),
      showLastUpdated: z.boolean().default(true),
      showDescription: z.boolean().default(true),
    }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("ANNOUNCEMENTS"),
    settings: z.object({ maxItems: z.number().int().min(1).max(10).default(3) }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("RICH_TEXT"),
    settings: z.object({
      heading: z.string().max(160).default(""),
      body: z.string().max(20_000).default(""),
      align: z.enum(["LEFT", "CENTER"]).default("LEFT"),
    }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("COMPONENT_STATUS"),
    settings: z.object({
      view: z.enum(["LIST", "CARDS", "GRID", "COMPACT", "UPTIME"]).default("LIST"),
      uptimeDays: z.union([z.literal(30), z.literal(60), z.literal(90)]).default(90),
      uptimeStyle: z.enum(UPTIME_BAR_STYLES).default("ROUNDED"),
      uptimeSize: z.enum(UPTIME_BAR_SIZES).default("RESPONSIVE"),
      uptimeIcon: z.enum(UPTIME_ICON_STYLES).default("NONE"),
      groupStyle: z.enum(["ACCORDION", "SECTIONS", "CARDS"]).default("ACCORDION"),
      groupingEnabled: z.boolean().default(false),
      componentStyle: z.enum(["ROWS", "PILLS"]).default("ROWS"),
      componentColumns: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(3),
      showSummary: z.boolean().default(false),
      showLegend: z.boolean().default(false),
      showDescriptions: z.boolean().default(true),
      showUptime: z.boolean().default(true),
      searchEnabled: z.boolean().default(false),
    }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("ACTIVE_INCIDENTS"),
    settings: z.object({ heading: z.string().max(120).default("Active incidents") }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("SCHEDULED_MAINTENANCE"),
    settings: z.object({ heading: z.string().max(120).default("Scheduled maintenance") }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("METRICS"),
    settings: z.object({
      heading: z.string().max(120).default("System metrics"),
      columns: z.union([z.literal(1), z.literal(2)]).default(2),
    }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("HISTORY_PREVIEW"),
    settings: z.object({
      heading: z.string().max(120).default("Past incidents"),
      days: z.union([z.literal(7), z.literal(14), z.literal(30)]).default(14),
    }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("SUBSCRIBE"),
    settings: z.object({
      style: z.enum(["BUTTON", "PANEL", "INLINE"]).default("BUTTON"),
      heading: z.string().max(120).default("Subscribe to updates"),
    }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("LINK_CARDS"),
    settings: z.object({
      links: z
        .array(
          z.object({
            label: z.string().min(1).max(80),
            description: z.string().max(240).default(""),
            url: httpUrl,
          })
        )
        .max(12)
        .default([]),
    }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("HISTORY_LIST"),
    settings: z.object({ showMaintenance: z.boolean().default(true) }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("INCIDENT_DETAIL"),
    settings: z.object({
      showAffectedComponents: z.boolean().default(true),
      showPostmortem: z.boolean().default(true),
    }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("ACCESS_FORM"),
    settings: z.object({ style: z.enum(["CARD", "CENTERED"]).default("CARD") }),
  }),
  z.object({
    ...commonBlock,
    type: z.literal("HUB_GRID"),
    settings: z.object({
      columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
      showDescriptions: z.boolean().default(true),
    }),
  }),
]);

export type PageDesignBlock = z.infer<typeof pageDesignBlockSchema>;

const gridPlacementSchema = z.object({
  blockId,
  order: z.number().int().min(0).max(99),
  column: z.number().int().min(1).max(PAGE_GRID_COLUMNS.desktop),
  span: z.number().int().min(1).max(PAGE_GRID_COLUMNS.desktop),
});

const responsiveGridSchema = z.object({
  desktop: z.array(gridPlacementSchema).max(80),
  tablet: z.array(gridPlacementSchema).max(80).nullable().default(null),
  mobile: z.array(gridPlacementSchema).max(80).nullable().default(null),
});

const surfaceSchema = z.object({
  full: z.array(pageDesignBlockSchema).max(30).default([]),
  primary: z.array(pageDesignBlockSchema).max(30).default([]),
  sidebar: z.array(pageDesignBlockSchema).max(20).default([]),
  grid: responsiveGridSchema,
});

const headerItemSchema = z.object({
  id: blockId,
  type: z.enum(["LOGO", "TITLE", "HUB_LINK", "NAVIGATION", "SUPPORT", "SUBSCRIBE"]),
  hidden: z.boolean().default(false),
});

const footerItemSchema = z.object({
  id: blockId,
  type: z.enum(["CUSTOM_TEXT", "LINKS", "LEGAL", "BRANDING", "COPYRIGHT"]),
  hidden: z.boolean().default(false),
});

function placementsFromLegacySurface(surface: Record<string, unknown>) {
  const full = Array.isArray(surface.full) ? surface.full : [];
  const primary = Array.isArray(surface.primary) ? surface.primary : [];
  const sidebar = Array.isArray(surface.sidebar) ? surface.sidebar : [];
  const idOf = (block: unknown) => typeof block === "object" && block !== null && "id" in block
    ? String((block as { id: unknown }).id)
    : "";
  return [
    ...full.map((block, order) => ({ blockId: idOf(block), order, column: 1, span: 12 })),
    ...primary.map((block, index) => ({ blockId: idOf(block), order: full.length + index, column: 1, span: sidebar.length ? 8 : 12 })),
    ...sidebar.map((block, index) => ({ blockId: idOf(block), order: full.length + primary.length + index, column: 9, span: 4 })),
  ].filter((placement) => placement.blockId);
}

// The light-only release retired the Midnight preset and the header theme
// toggle. Stored designs still carry them, so map them to current values
// instead of failing validation and losing the owner's design.
function dropRetiredThemeFields(design: Record<string, unknown>) {
  const theme = design.theme as { preset?: unknown } | undefined;
  if (theme && typeof theme === "object" && theme.preset === "MIDNIGHT") theme.preset = "DEFAULT";
  const header = (design.chrome as { header?: { items?: unknown } } | undefined)?.header;
  if (header && Array.isArray(header.items)) {
    header.items = header.items.filter((item) => (item as { type?: unknown })?.type !== "THEME_TOGGLE");
  }
}

function migrateDesignInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const design = structuredClone(input) as Record<string, unknown>;
  dropRetiredThemeFields(design);
  const surfaces = design.surfaces;
  if (!surfaces || typeof surfaces !== "object" || Array.isArray(surfaces)) return design;
  const nextSurfaces: Record<string, unknown> = {};
  for (const [key, rawSurface] of Object.entries(surfaces)) {
    if (!rawSurface || typeof rawSurface !== "object" || Array.isArray(rawSurface)) {
      nextSurfaces[key] = rawSurface;
      continue;
    }
    const surface = rawSurface as Record<string, unknown>;
    nextSurfaces[key] = {
      ...surface,
      grid: surface.grid ?? {
        desktop: placementsFromLegacySurface(surface),
        tablet: null,
        mobile: null,
      },
    };
  }
  design.schemaVersion = PAGE_DESIGN_SCHEMA_VERSION;
  design.surfaces = nextSurfaces;
  return design;
}

const statusPageDesignV2Schema = z
  .object({
    schemaVersion: z.literal(PAGE_DESIGN_SCHEMA_VERSION),
    templateKey: z.enum(PAGE_TEMPLATE_KEYS),
    theme: z.object({
      preset: z.enum(PAGE_THEME_PRESET_KEYS).default("DEFAULT"),
      palette: z.object({
        brand: hexColor,
        accent: hexColor,
        background: hexColor,
        surface: hexColor,
        text: hexColor,
        mutedText: hexColor,
        operational: hexColor,
        degraded: hexColor,
        partialOutage: hexColor,
        majorOutage: hexColor,
        maintenance: hexColor,
      }),
      typography: z.enum(["SYSTEM", "HUMANIST", "GEOMETRIC", "MONO"]).default("SYSTEM"),
      density: z.enum(["COMPACT", "COMFORTABLE", "SPACIOUS"]).default("COMFORTABLE"),
      contentWidth: z.enum(["NARROW", "STANDARD", "WIDE"]).default("STANDARD"),
      radius: z.enum(["NONE", "SMALL", "MEDIUM", "LARGE"]).default("MEDIUM"),
      shadow: z.enum(["NONE", "SUBTLE", "ELEVATED"]).default("SUBTLE"),
    }),
    chrome: z.object({
      header: z.object({
        variant: z.enum(["STANDARD", "CENTERED", "HERO", "MINIMAL"]).default("STANDARD"),
        sticky: z.boolean().default(false),
        items: z.array(headerItemSchema).max(12),
        links: z
          .array(z.object({ label: z.string().min(1).max(80), url: httpUrl }))
          .max(12)
          .default([]),
      }),
      footer: z.object({
        items: z.array(footerItemSchema).max(12),
        customText: z.string().max(500).default(""),
        links: z
          .array(z.object({ label: z.string().min(1).max(80), url: httpUrl }))
          .max(12)
          .default([]),
      }),
    }),
    presentation: z.object({
      logoUrl: imageUrl.nullable().default(null),
      faviconUrl: imageUrl.nullable().default(null),
      coverImageUrl: imageUrl.nullable().default(null),
      coverImageFit: z.enum(["COVER", "CONTAIN"]).default("COVER"),
      coverImagePositionX: z.number().min(0).max(100).default(50),
      coverImagePositionY: z.number().min(0).max(100).default(50),
      coverImageCropX: z.number().min(0).max(100).nullable().default(null),
      coverImageCropY: z.number().min(0).max(100).nullable().default(null),
      coverImageCropWidth: z.number().min(0).max(100).nullable().default(null),
      coverImageCropHeight: z.number().min(0).max(100).nullable().default(null),
      supportUrl: visitorUrl.nullable().default(null),
      termsUrl: httpUrl.nullable().default(null),
      privacyUrl: httpUrl.nullable().default(null),
    }).prefault({}),
    surfaces: z.object({
      status: surfaceSchema,
      history: surfaceSchema,
      incident: surfaceSchema,
      access: surfaceSchema,
      hub: surfaceSchema,
      embed: surfaceSchema,
    }),
    seo: z.object({
      title: z.string().max(160).default(""),
      description: z.string().max(320).default(""),
      socialImageUrl: imageUrl.nullable().default(null),
      noIndex: z.boolean().default(false),
    }),
  })
  .superRefine((design, context) => {
    const contrastPairs: Array<[string, string, string]> = [
      [design.theme.palette.text, design.theme.palette.background, "Light text/background"],
      [design.theme.palette.text, design.theme.palette.surface, "Light text/surface"],
    ];
    for (const [foreground, background, label] of contrastPairs) {
      if (contrastRatio(foreground, background) < 4.5) {
        context.addIssue({
          code: "custom",
          path: ["theme"],
          message: `${label} contrast must meet WCAG AA`,
        });
      }
    }
  });

export const statusPageDesignSchema = z.preprocess(migrateDesignInput, statusPageDesignV2Schema);

export type StatusPageDesign = z.infer<typeof statusPageDesignSchema>;
export type PageSurfaceKey = keyof StatusPageDesign["surfaces"];
export type PageDesignZone = "full" | "primary" | "sidebar";
export type PageGridPlacement = z.infer<typeof gridPlacementSchema>;

export function pageGridPlacements(
  design: StatusPageDesign,
  surface: PageSurfaceKey,
  breakpoint: PageDesignBreakpoint
) {
  const configured = design.surfaces[surface].grid[breakpoint];
  if (breakpoint === "desktop" || configured) return configured ?? [];
  const columns = PAGE_GRID_COLUMNS[breakpoint];
  return design.surfaces[surface].grid.desktop.map((placement) => {
    const column = Math.max(1, Math.round(((placement.column - 1) / PAGE_GRID_COLUMNS.desktop) * columns) + 1);
    const span = Math.max(1, Math.round((placement.span / PAGE_GRID_COLUMNS.desktop) * columns));
    return {
      ...placement,
      column: Math.min(column, columns),
      span: Math.min(span, columns - Math.min(column, columns) + 1),
    };
  });
}

export function updatePageGridPlacement(
  design: StatusPageDesign,
  surface: PageSurfaceKey,
  breakpoint: PageDesignBreakpoint,
  blockIdValue: string,
  patch: Partial<Pick<PageGridPlacement, "column" | "span" | "order">>
) {
  const next = structuredClone(design);
  const columns = PAGE_GRID_COLUMNS[breakpoint];
  const placements = breakpoint === "desktop"
    ? next.surfaces[surface].grid.desktop
    : next.surfaces[surface].grid[breakpoint] ?? pageGridPlacements(next, surface, breakpoint);
  const index = placements.findIndex((placement) => placement.blockId === blockIdValue);
  if (index < 0) return next;
  const current = placements[index];
  const column = Math.max(1, Math.min(columns, patch.column ?? current.column));
  const span = Math.max(1, Math.min(columns - column + 1, patch.span ?? current.span));
  placements[index] = { ...current, ...patch, column, span };
  const normalized = placements
    .sort((left, right) => left.order - right.order)
    .map((placement, order) => ({ ...placement, order }));
  if (breakpoint === "desktop") next.surfaces[surface].grid.desktop = normalized;
  else next.surfaces[surface].grid[breakpoint] = normalized;
  return statusPageDesignSchema.parse(next);
}

export function resetPageGridBreakpoint(
  design: StatusPageDesign,
  surface: PageSurfaceKey,
  breakpoint: Exclude<PageDesignBreakpoint, "desktop">
) {
  const next = structuredClone(design);
  next.surfaces[surface].grid[breakpoint] = null;
  return statusPageDesignSchema.parse(next);
}

export function movePageDesignBlock(
  design: StatusPageDesign,
  surface: PageSurfaceKey,
  activeId: string,
  overId: string
) {
  const zoneKeys: PageDesignZone[] = ["full", "primary", "sidebar"];
  const sourceZone = zoneKeys.find((zone) => design.surfaces[surface][zone].some((block) => block.id === activeId));
  const targetZone = overId.startsWith("zone-")
    ? zoneKeys.find((zone) => zone === overId.slice(5))
    : zoneKeys.find((zone) => design.surfaces[surface][zone].some((block) => block.id === overId));
  if (!sourceZone || !targetZone) return null;
  const sourceIndex = design.surfaces[surface][sourceZone].findIndex((block) => block.id === activeId);
  const targetIndex = overId.startsWith("zone-")
    ? design.surfaces[surface][targetZone].length
    : design.surfaces[surface][targetZone].findIndex((block) => block.id === overId);
  if (sourceIndex < 0 || targetIndex < 0 || (sourceZone === targetZone && sourceIndex === targetIndex)) return null;

  const next = structuredClone(design);
  const [moved] = next.surfaces[surface][sourceZone].splice(sourceIndex, 1);
  next.surfaces[surface][targetZone].splice(targetIndex, 0, moved);
  return { design: next, moved, sourceZone, targetZone };
}

const b = <T extends PageDesignBlock>(block: T) => block;
const standardHeader = [
  { id: "header-logo", type: "LOGO" as const, hidden: false },
  { id: "header-title", type: "TITLE" as const, hidden: false },
  { id: "header-hub", type: "HUB_LINK" as const, hidden: false },
  { id: "header-navigation", type: "NAVIGATION" as const, hidden: false },
  { id: "header-support", type: "SUPPORT" as const, hidden: false },
  { id: "header-subscribe", type: "SUBSCRIBE" as const, hidden: true },
];
const standardFooter = [
  { id: "footer-text", type: "CUSTOM_TEXT" as const, hidden: true },
  { id: "footer-links", type: "LINKS" as const, hidden: false },
  { id: "footer-legal", type: "LEGAL" as const, hidden: false },
  { id: "footer-branding", type: "BRANDING" as const, hidden: false },
  { id: "footer-copyright", type: "COPYRIGHT" as const, hidden: false },
];

function baseDesign(templateKey: PageTemplateKey, brand = "#0f8ca8"): StatusPageDesign {
  const overall = (id: string) => b({
    id,
    type: "OVERALL_STATUS" as const,
    hidden: false,
    settings: { style: "PANEL" as const, showLastUpdated: true, showDescription: true },
  });
  const components = b({
    id: "component-status",
    type: "COMPONENT_STATUS",
    hidden: false,
    settings: {
      view: "LIST",
      uptimeDays: 90,
      uptimeStyle: "ROUNDED",
      uptimeSize: "RESPONSIVE",
      uptimeIcon: "NONE",
      groupStyle: "ACCORDION",
      groupingEnabled: false,
      componentStyle: "ROWS",
      componentColumns: 3,
      showSummary: false,
      showLegend: false,
      showDescriptions: true,
      showUptime: true,
      searchEnabled: false,
    },
  });
  return statusPageDesignSchema.parse({
    schemaVersion: 1,
    templateKey,
    theme: {
      preset: "DEFAULT",
      palette: {
        brand,
        accent: brand,
        background: "#f5f7fb",
        surface: "#ffffff",
        text: "#132033",
        mutedText: "#526174",
        operational: COMPONENT_STATUS_COLOR.OPERATIONAL,
        degraded: COMPONENT_STATUS_COLOR.DEGRADED_PERFORMANCE,
        partialOutage: COMPONENT_STATUS_COLOR.PARTIAL_OUTAGE,
        majorOutage: COMPONENT_STATUS_COLOR.MAJOR_OUTAGE,
        maintenance: COMPONENT_STATUS_COLOR.UNDER_MAINTENANCE,
      },
      typography: "SYSTEM",
      density: "COMFORTABLE",
      contentWidth: "STANDARD",
      radius: "MEDIUM",
      shadow: "SUBTLE",
    },
    chrome: {
      header: { variant: "STANDARD", sticky: false, items: standardHeader, links: [] },
      footer: { items: standardFooter, customText: "", links: [] },
    },
    presentation: {},
    surfaces: {
      status: {
        full: [
          overall("overall-status"),
          b({ id: "announcements", type: "ANNOUNCEMENTS", hidden: false, settings: { maxItems: 3 } }),
        ],
        primary: [
          b({ id: "active-incidents", type: "ACTIVE_INCIDENTS", hidden: false, settings: { heading: "Active incidents" } }),
          b({ id: "maintenance", type: "SCHEDULED_MAINTENANCE", hidden: false, settings: { heading: "Active maintenance" } }),
          b({ id: "history-preview", type: "HISTORY_PREVIEW", hidden: false, settings: { heading: "Past maintenance", days: 14 } }),
          components,
          b({ id: "metrics", type: "METRICS", hidden: false, settings: { heading: "System metrics", columns: 2 } }),
        ],
        sidebar: [
          b({ id: "subscribe", type: "SUBSCRIBE", hidden: false, settings: { style: "PANEL", heading: "Subscribe to updates" } }),
        ],
      },
      history: {
        full: [b({ id: "history-list", type: "HISTORY_LIST", hidden: false, settings: { showMaintenance: true } })],
        primary: [],
        sidebar: [],
      },
      incident: {
        full: [b({ id: "incident-detail", type: "INCIDENT_DETAIL", hidden: false, settings: { showAffectedComponents: true, showPostmortem: true } })],
        primary: [],
        sidebar: [],
      },
      access: {
        full: [b({ id: "access-form", type: "ACCESS_FORM", hidden: false, settings: { style: "CARD" } })],
        primary: [],
        sidebar: [],
      },
      hub: {
        full: [
          overall("hub-overall-status"),
          b({ id: "hub-announcements", type: "ANNOUNCEMENTS", hidden: false, settings: { maxItems: 3 } }),
          b({ id: "hub-grid", type: "HUB_GRID", hidden: false, settings: { columns: 2, showDescriptions: true } }),
        ],
        primary: [],
        sidebar: [],
      },
      embed: { full: [overall("embed-overall-status")], primary: [], sidebar: [] },
    },
    seo: { title: "", description: "", socialImageUrl: null, noIndex: false },
  });
}

export function templateDesign(templateKey: PageTemplateKey, brand = "#0f8ca8"): StatusPageDesign {
  const design = baseDesign(templateKey, brand);
  const components = design.surfaces.status.primary.find((block) => block.type === "COMPONENT_STATUS");
  switch (templateKey) {
    case "CENTERED_SUMMARY":
      design.chrome.header.variant = "CENTERED";
      design.surfaces.status.full[0].settings = { style: "CENTERED", showLastUpdated: true, showDescription: true };
      break;
    case "BANNER_SPOTLIGHT":
      design.chrome.header.variant = "STANDARD";
      design.theme.contentWidth = "WIDE";
      design.theme.density = "SPACIOUS";
      design.surfaces.status.full[0].settings = { style: "CENTERED", showLastUpdated: true, showDescription: true };
      break;
    case "UPTIME_TIMELINE":
      if (components?.type === "COMPONENT_STATUS") {
        components.settings.view = "UPTIME";
        components.settings.groupStyle = "SECTIONS";
      }
      design.theme.contentWidth = "WIDE";
      break;
    case "ILLUSTRATED_HERO":
      design.chrome.header.variant = "HERO";
      design.theme.density = "SPACIOUS";
      design.surfaces.status.full[0].settings = { style: "SOLID", showLastUpdated: true, showDescription: true };
      break;
    case "GROUPED_DIRECTORY":
      if (components?.type === "COMPONENT_STATUS") {
        components.settings.view = "LIST";
        components.settings.groupStyle = "ACCORDION";
        components.settings.searchEnabled = true;
        components.settings.showUptime = false;
      }
      design.theme.contentWidth = "WIDE";
      break;
    case "PRODUCT_GRID":
      if (components?.type === "COMPONENT_STATUS") {
        components.settings.view = "GRID";
        components.settings.groupStyle = "CARDS";
        components.settings.showUptime = false;
      }
      design.theme.contentWidth = "WIDE";
      break;
    case "DENSE_OPERATIONS":
      design.theme.density = "COMPACT";
      design.theme.contentWidth = "WIDE";
      design.theme.radius = "SMALL";
      if (components?.type === "COMPONENT_STATUS") components.settings.view = "CARDS";
      break;
    case "MINIMAL_ENTERPRISE":
      design.chrome.header.variant = "MINIMAL";
      design.theme.radius = "NONE";
      design.theme.shadow = "NONE";
      design.surfaces.status.full[0].settings = { style: "SOLID", showLastUpdated: true, showDescription: false };
      if (components?.type === "COMPONENT_STATUS") components.settings.showUptime = false;
      break;
  }
  const statusBlocks = allSurfaceBlocks(design, "status");
  const place = (type: PageDesignBlock["type"], column: number, span: number) => {
    const block = statusBlocks.find((candidate) => candidate.type === type);
    const placement = block && design.surfaces.status.grid.desktop.find((candidate) => candidate.blockId === block.id);
    if (placement) Object.assign(placement, { column, span });
  };
  if (["BANNER_SPOTLIGHT", "UPTIME_TIMELINE", "PRODUCT_GRID"].includes(templateKey)) {
    place("COMPONENT_STATUS", 1, 12);
    place("METRICS", 1, 6);
    place("SUBSCRIBE", 1, 6);
  } else if (templateKey === "ILLUSTRATED_HERO") {
    place("OVERALL_STATUS", 1, 7);
    place("SUBSCRIBE", 9, 4);
    place("COMPONENT_STATUS", 1, 12);
  } else if (templateKey === "DENSE_OPERATIONS") {
    place("OVERALL_STATUS", 1, 4);
    place("ANNOUNCEMENTS", 5, 8);
    place("METRICS", 7, 6);
    place("COMPONENT_STATUS", 1, 12);
  } else if (templateKey === "MINIMAL_ENTERPRISE") {
    for (const placement of design.surfaces.status.grid.desktop) Object.assign(placement, { column: 1, span: 12 });
  }
  for (const type of ["ACTIVE_INCIDENTS", "SCHEDULED_MAINTENANCE", "HISTORY_PREVIEW"] as const) {
    place(type, 1, 12);
  }
  return statusPageDesignSchema.parse(design);
}

export function pageThemePreset(key: PageThemePresetKey): StatusPageDesign["theme"] {
  const theme = structuredClone(baseDesign("CENTERED_SUMMARY").theme);
  theme.preset = key;
  switch (key) {
    case "DEFAULT":
      return theme;
    case "OCEAN":
      theme.palette = { ...theme.palette, brand: "#0369a1", accent: "#22a6c7", background: "#f0f9ff", surface: "#ffffff", text: "#0c3b58", mutedText: "#527086" };
      theme.radius = "LARGE";
      return theme;
    case "EMERALD":
      theme.palette = { ...theme.palette, brand: "#047857", accent: "#22a875", background: "#f0fdf4", surface: "#ffffff", text: "#064e3b", mutedText: "#557568" };
      theme.radius = "LARGE";
      return theme;
    case "SUNSET":
      theme.palette = { ...theme.palette, brand: "#c2410c", accent: "#e79b13", background: "#fff7ed", surface: "#ffffff", text: "#5a2411", mutedText: "#8a6252" };
      theme.typography = "HUMANIST";
      return theme;
    case "VIOLET":
      theme.palette = { ...theme.palette, brand: "#7c3aed", accent: "#db2777", background: "#faf5ff", surface: "#ffffff", text: "#3b1768", mutedText: "#755e8e" };
      theme.radius = "LARGE";
      theme.shadow = "ELEVATED";
      return theme;
    case "SLATE":
      theme.palette = { ...theme.palette, brand: "#334155", accent: "#64748b", background: "#f8fafc", surface: "#ffffff", text: "#0f172a", mutedText: "#64748b" };
      theme.radius = "SMALL";
      theme.shadow = "NONE";
      return theme;
    case "HIGH_CONTRAST":
      theme.palette = { ...theme.palette, brand: "#005fcc", accent: "#005fcc", background: "#ffffff", surface: "#ffffff", text: "#000000", mutedText: "#333333" };
      theme.radius = "NONE";
      theme.shadow = "NONE";
      return theme;
    case "WARM_PAPER":
      theme.palette = { ...theme.palette, brand: "#9a3412", accent: "#b7791f", background: "#fffaf0", surface: "#fffef9", text: "#422006", mutedText: "#82644c" };
      theme.typography = "HUMANIST";
      theme.radius = "SMALL";
      return theme;
    case "SOFT_BLUE":
      theme.palette = { ...theme.palette, brand: "#2563eb", accent: "#0891b2", background: "#f5f7ff", surface: "#ffffff", text: "#172554", mutedText: "#63709a" };
      theme.density = "SPACIOUS";
      theme.radius = "LARGE";
      return theme;
    case "TEAL":
      theme.palette = { ...theme.palette, brand: "#0f766e", accent: "#14b8a6", background: "#f0fdfa", surface: "#ffffff", text: "#134e4a", mutedText: "#4f746f" };
      theme.radius = "MEDIUM";
      return theme;
    case "ROSE":
      theme.palette = { ...theme.palette, brand: "#be123c", accent: "#f43f5e", background: "#fff1f2", surface: "#ffffff", text: "#4c0519", mutedText: "#8a5563" };
      theme.radius = "LARGE";
      theme.shadow = "ELEVATED";
      return theme;
    case "INDIGO":
      theme.palette = { ...theme.palette, brand: "#4338ca", accent: "#6366f1", background: "#f5f5ff", surface: "#ffffff", text: "#1e1b4b", mutedText: "#5b5b8a" };
      theme.radius = "SMALL";
      return theme;
  }
}

export function designWithThemePreset(design: StatusPageDesign, key: PageThemePresetKey) {
  const next = structuredClone(design);
  // Layout owns density and width; a style preset only changes colors, type, corners, and depth.
  const { density, contentWidth } = next.theme;
  next.theme = { ...pageThemePreset(key), density, contentWidth };
  return statusPageDesignSchema.parse(next);
}

export function legacyPageDesign(page: {
  brandColor?: string | null;
  layout?: string | null;
  themePreset?: string | null;
}): StatusPageDesign {
  const templateKey: PageTemplateKey =
    PAGE_TEMPLATE_KEYS.includes(page.layout as PageTemplateKey)
      ? (page.layout as PageTemplateKey)
      : page.layout === "COVER"
      ? "ILLUSTRATED_HERO"
      : page.layout === "MINIMAL"
        ? "MINIMAL_ENTERPRISE"
        : "CENTERED_SUMMARY";
  const design = templateDesign(templateKey, page.brandColor || "#0f8ca8");
  if (PAGE_THEME_PRESET_KEYS.includes(page.themePreset as PageThemePresetKey)) {
    return designWithThemePreset(design, page.themePreset as PageThemePresetKey);
  }
  if (page.themePreset === "CALM") {
    design.theme.palette.background = "#f7f7f4";
    design.theme.palette.surface = "#fffefa";
    design.theme.palette.text = "#20221f";
    design.theme.palette.mutedText = "#5e625b";
  } else if (page.themePreset === "CONTRAST") {
    design.theme.palette.background = "#ffffff";
    design.theme.palette.surface = "#ffffff";
    design.theme.palette.text = "#070b12";
    design.theme.palette.mutedText = "#344054";
  }
  return statusPageDesignSchema.parse(design);
}

export function pageDesignFor(page: {
  publishedDesign?: unknown;
  brandColor?: string | null;
  layout?: string | null;
  themePreset?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  coverImageUrl?: string | null;
  coverImageFit?: "COVER" | "CONTAIN" | null;
  coverImagePositionX?: number | null;
  coverImagePositionY?: number | null;
  coverImageCropX?: number | null;
  coverImageCropY?: number | null;
  coverImageCropWidth?: number | null;
  coverImageCropHeight?: number | null;
  supportUrl?: string | null;
  termsUrl?: string | null;
  privacyUrl?: string | null;
}) {
  const storedHasPresentation = Boolean(
    page.publishedDesign && typeof page.publishedDesign === "object" && "presentation" in page.publishedDesign
  );
  const parsed = statusPageDesignSchema.safeParse(page.publishedDesign);
  const design = parsed.success ? parsed.data : legacyPageDesign(page);
  return storedHasPresentation ? design : designWithPagePresentation(design, page);
}

export function designWithPagePresentation(
  design: StatusPageDesign,
  page: {
    logoUrl?: string | null;
    faviconUrl?: string | null;
    coverImageUrl?: string | null;
    coverImageFit?: "COVER" | "CONTAIN" | null;
    coverImagePositionX?: number | null;
    coverImagePositionY?: number | null;
    coverImageCropX?: number | null;
    coverImageCropY?: number | null;
    coverImageCropWidth?: number | null;
    coverImageCropHeight?: number | null;
    supportUrl?: string | null;
    termsUrl?: string | null;
    privacyUrl?: string | null;
  }
) {
  const next = structuredClone(design);
  next.presentation = {
    logoUrl: page.logoUrl ?? null,
    faviconUrl: page.faviconUrl ?? null,
    coverImageUrl: page.coverImageUrl ?? null,
    coverImageFit: page.coverImageFit ?? "COVER",
    coverImagePositionX: page.coverImagePositionX ?? 50,
    coverImagePositionY: page.coverImagePositionY ?? 50,
    coverImageCropX: page.coverImageCropX ?? null,
    coverImageCropY: page.coverImageCropY ?? null,
    coverImageCropWidth: page.coverImageCropWidth ?? null,
    coverImageCropHeight: page.coverImageCropHeight ?? null,
    supportUrl: page.supportUrl ?? null,
    termsUrl: page.termsUrl ?? null,
    privacyUrl: page.privacyUrl ?? null,
  };
  return statusPageDesignSchema.parse(next);
}

export function allSurfaceBlocks(design: StatusPageDesign, surface: PageSurfaceKey) {
  return [
    ...design.surfaces[surface].full,
    ...design.surfaces[surface].primary,
    ...design.surfaces[surface].sidebar,
  ];
}

export function applyPageTemplateLayout(design: StatusPageDesign, templateKey: PageTemplateKey) {
  const template = templateDesign(templateKey, design.theme.palette.brand);
  const next = structuredClone(design);
  next.templateKey = templateKey;
  // Carry over what makes the layout look different on the public page. Palette, fonts, radius,
  // presentation, and the other block settings stay as the owner configured them.
  next.chrome.header.variant = template.chrome.header.variant;
  next.theme.density = template.theme.density;
  next.theme.contentWidth = template.theme.contentWidth;
  const banner = next.surfaces.status.full.find((block) => block.type === "OVERALL_STATUS");
  const templateBanner = template.surfaces.status.full.find((block) => block.type === "OVERALL_STATUS");
  if (banner?.type === "OVERALL_STATUS" && templateBanner?.type === "OVERALL_STATUS") banner.settings = { ...templateBanner.settings };
  const services = allSurfaceBlocks(next, "status").find((block) => block.type === "COMPONENT_STATUS");
  const templateServices = allSurfaceBlocks(template, "status").find((block) => block.type === "COMPONENT_STATUS");
  if (services?.type === "COMPONENT_STATUS" && templateServices?.type === "COMPONENT_STATUS") {
    const { view, groupStyle, showUptime } = templateServices.settings;
    Object.assign(services.settings, { view, groupStyle, showUptime });
  }
  for (const surface of Object.keys(next.surfaces) as PageSurfaceKey[]) {
    const currentBlocks = allSurfaceBlocks(next, surface);
    const templatePlacements = template.surfaces[surface].grid.desktop;
    const templateOrder = new Map(
      allSurfaceBlocks(template, surface).map((block, index) => [block.type, index])
    );
    const arranged = [...currentBlocks].sort((left, right) =>
      (templateOrder.get(left.type) ?? 999) - (templateOrder.get(right.type) ?? 999)
    );
    next.surfaces[surface].grid.desktop = arranged.map((block, order) => {
      const templateBlock = allSurfaceBlocks(template, surface).find((candidate) => candidate.type === block.type);
      const slot = templateBlock
        ? templatePlacements.find((placement) => placement.blockId === templateBlock.id)
        : null;
      return {
        blockId: block.id,
        order,
        column: slot?.column ?? 1,
        span: slot?.span ?? PAGE_GRID_COLUMNS.desktop,
      };
    });
    next.surfaces[surface].grid.tablet = null;
    next.surfaces[surface].grid.mobile = null;
  }
  return statusPageDesignSchema.parse(next);
}

export function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(color: string) {
  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
