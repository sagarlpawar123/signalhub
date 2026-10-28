import { expect, test } from "@playwright/test";

test.describe("button interaction guard", () => {
  test("blocks duplicate UI clicks and releases the short lock", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const button = document.createElement("button");
      button.id = "guard-ui-button";
      button.type = "button";
      button.textContent = "Close";
      button.addEventListener("click", () => {
        const state = window as typeof window & { guardClickCount?: number };
        state.guardClickCount = (state.guardClickCount ?? 0) + 1;
      });
      document.body.append(button);
    });

    const button = page.locator("#guard-ui-button");
    await button.click();
    await button.dispatchEvent("click");

    await expect(button).toHaveAttribute("data-button-busy", "interaction");
    await expect.poll(() => page.evaluate(() => (window as typeof window & { guardClickCount?: number }).guardClickCount)).toBe(1);

    await expect(button).not.toHaveAttribute("data-button-guard-locked", "true");
    await button.click();
    await expect.poll(() => page.evaluate(() => (window as typeof window & { guardClickCount?: number }).guardClickCount)).toBe(2);
  });

  test("shows action progress, suppresses duplicate submits, and recovers on timeout", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const form = document.createElement("form");
      const button = document.createElement("button");
      button.id = "guard-submit-button";
      button.type = "submit";
      button.textContent = "Save settings";
      button.dataset.buttonTimeoutMs = "600";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const state = window as typeof window & { guardSubmitCount?: number };
        state.guardSubmitCount = (state.guardSubmitCount ?? 0) + 1;
      });
      form.append(button);
      document.body.append(form);
    });

    const button = page.locator("#guard-submit-button");
    await button.click();
    await button.dispatchEvent("click");

    await expect(button).toHaveAttribute("data-button-busy", "saving");
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect.poll(() => page.evaluate(() => (window as typeof window & { guardSubmitCount?: number }).guardSubmitCount)).toBe(1);

    await expect(page.getByRole("alert")).toContainText("Save settings timed out. Please try again.");
    await expect(button).not.toHaveAttribute("data-button-guard-locked", "true");

    await button.click();
    await expect.poll(() => page.evaluate(() => (window as typeof window & { guardSubmitCount?: number }).guardSubmitCount)).toBe(2);
  });
});


test("pending actions keep their lock past the UI deadline and release on completion", async ({ page }) => {
  await page.goto("/");
  await page.clock.install();
  await page.evaluate(() => {
    const form = document.createElement("form");
    form.id = "managed-action";
    const button = document.createElement("button");
    button.id = "managed-submit";
    button.type = "submit";
    button.textContent = "Schedule maintenance";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.dataset.actionPending = "true";
      const state = window as typeof window & { managedSubmitCount?: number };
      state.managedSubmitCount = (state.managedSubmitCount ?? 0) + 1;
    });
    form.append(button);
    document.body.append(form);
  });
  const button = page.locator("#managed-submit");
  await button.click();
  await page.clock.fastForward(16_000);
  await expect(button).toHaveAttribute("data-button-guard-locked", "true");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await button.dispatchEvent("click");
  expect(await page.evaluate(() => (window as typeof window & { managedSubmitCount?: number }).managedSubmitCount)).toBe(1);
  await page.evaluate(() => {
    const form = document.getElementById("managed-action")!;
    delete form.dataset.actionPending;
    form.dispatchEvent(new Event("signalhub:button-action-complete", { bubbles: true }));
  });
  await expect(button).not.toHaveAttribute("data-button-guard-locked", "true");
});
