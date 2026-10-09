import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PageSurfaceLayout } from "../components/public/PageSurfaceLayout";
import { templateDesign } from "../lib/page-design";

const publicStatusPage = readFileSync("app/(public)/[slug]/page.tsx", "utf8");
const publicHubPage = readFileSync("app/(public)/hub/[slug]/page.tsx", "utf8");

describe("public subscription panel placement", () => {
  it("keeps the panel title and subscription action together on desktop while stacking naturally on small screens", () => {
    for (const source of [publicStatusPage, publicHubPage]) {
      expect(source).toContain('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between');
      expect(source).toContain('block.settings.style === "PANEL" ? "min-w-0 font-semibold" : "mb-3 font-semibold"');
    }
  });

  it("places the grouped-directory subscription after status content as a centered callout", () => {
    const markup = renderToStaticMarkup(
      createElement(PageSurfaceLayout, {
        design: templateDesign("GROUPED_DIRECTORY"),
        surface: "status",
        renderBlock: (block) => createElement("span", null, block.type),
      }),
    );

    expect(markup).toContain('class="mx-auto mt-[var(--page-block-gap)] w-full max-w-2xl"');
    expect(markup.indexOf('data-page-block="SCHEDULED_MAINTENANCE"')).toBeLessThan(markup.indexOf('data-page-block="SUBSCRIBE"'));
  });

  it("also moves the illustrated-hero subscription below incident history", () => {
    const markup = renderToStaticMarkup(
      createElement(PageSurfaceLayout, {
        design: templateDesign("ILLUSTRATED_HERO"),
        surface: "status",
        renderBlock: (block) => createElement("span", null, block.type),
      }),
    );

    expect(markup.indexOf('data-page-block="SCHEDULED_MAINTENANCE"')).toBeLessThan(markup.indexOf('data-page-block="SUBSCRIBE"'));
  });
});
