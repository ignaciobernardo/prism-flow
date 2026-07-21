import { expect, test, type Page } from "@playwright/test";

import { appPerformance } from "../src/app/app-performance";
import {
  applyToolcraftPerformanceStressFixture,
  applyToolcraftPerformanceWorkloadFixture,
  dragToolcraftCanvasViewport,
  dragToolcraftSliderByLabel,
  dragToolcraftSliderToPerformanceStressValue,
  dragToolcraftSliderToValue,
  expectToolcraftCanvasBackingPixelsForRenderScale,
  expectToolcraftCanvasViewportStable,
  expectToolcraftDiscreteSliderDragSmoothness,
  expectToolcraftScenarioPerformanceBudget,
  getToolcraftFieldByLabel,
  getToolcraftPerformanceStressValue,
  measureToolcraftAnimationFrames,
  measureToolcraftInteraction,
  zoomToolcraftCanvasViewport,
} from "./performance-helpers";

const productSelector = '[data-testid="prism-flow-canvas"]';

async function openApp(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator(productSelector)).toBeVisible();
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0 && (await pause.first().isVisible())) await pause.first().click();
}

async function sectionTextInput(page: Page, sectionTitle: string, index = 0) {
  const title = page.locator('[data-slot="panel-title"]', { hasText: sectionTitle });
  const section = page.locator("section").filter({ has: title }).first();
  await section.scrollIntoViewIfNeeded();
  return section.locator('input[type="text"]').nth(index);
}

async function exportSection(page: Page, sectionTitle: string) {
  const title = page.locator('[data-slot="panel-title"]', { hasText: sectionTitle });
  const section = page.locator("section").filter({ has: title }).first();
  await section.scrollIntoViewIfNeeded();
  return section;
}

const rasterAppliers = (page: Page) => ({
  renderScale: async (value: unknown) => {
    const numericValue = Number(value);
    const field = await getToolcraftFieldByLabel(page, "Resolution scale");
    const slider = field.getByRole("slider");
    await slider.press(numericValue >= 2 ? "End" : "Home");
    await expect.poll(async () => page.locator(productSelector).evaluate((canvas) => (canvas as HTMLCanvasElement).width)).toBeGreaterThanOrEqual(1600 * numericValue - 1);
    await expectToolcraftCanvasBackingPixelsForRenderScale(page, productSelector, numericValue);
  },
  grain: async (value: unknown) => dragToolcraftSliderToValue(page, "Grain", Number(value)),
  softness: async (value: unknown) => dragToolcraftSliderToValue(page, "Softness", Number(value)),
});

const motionAppliers = (page: Page) => ({
  grain: rasterAppliers(page).grain,
  softness: rasterAppliers(page).softness,
});

test("browser perf: prism-focus-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const title = page.locator('[data-slot="panel-title"]', { hasText: "Focus" });
  const field = page.locator("section").filter({ has: title }).first();
  const result = await measureToolcraftInteraction(page, async () => {
    const pad = field.getByRole("button", { name: "Focus X/Y pad" });
    const box = await pad.boundingBox();
    if (!box) throw new Error("Focus X/Y pad is not measurable.");
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.7);
  });
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "prism-focus-change");
});

test("browser perf: prism-opening-drag keeps live slider feedback responsive", async ({ page }) => {
  await openApp(page);
  const result = await measureToolcraftInteraction(page, () => dragToolcraftSliderByLabel(page, "Opening", 0.82));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "prism-opening-drag");
});
test("browser perf: prism-curvature-drag keeps live slider feedback responsive", async ({ page }) => {
  await openApp(page);
  const result = await measureToolcraftInteraction(page, () => dragToolcraftSliderByLabel(page, "Curvature", 0.82));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "prism-curvature-drag");
});
test("browser perf: prism-volume-drag keeps live slider feedback responsive", async ({ page }) => {
  await openApp(page);
  const result = await measureToolcraftInteraction(page, () => dragToolcraftSliderByLabel(page, "Volume", 0.82));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "prism-volume-drag");
});
test("browser perf: texture-softness-drag keeps live slider feedback responsive", async ({ page }) => {
  await openApp(page);
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "texture-softness-drag", {
    renderScale: rasterAppliers(page).renderScale,
    grain: rasterAppliers(page).grain,
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, productSelector, 2);
  getToolcraftPerformanceStressValue(appPerformance, "texture-softness-drag");
  await dragToolcraftSliderByLabel(page, "Softness", 0.5);
  const result = await measureToolcraftInteraction(page, () => dragToolcraftSliderToPerformanceStressValue(page, "Softness", appPerformance, "texture-softness-drag"));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "texture-softness-drag");
});
test("browser perf: texture-intensity-drag keeps live slider feedback responsive", async ({ page }) => {
  await openApp(page);
  const result = await measureToolcraftInteraction(page, () => dragToolcraftSliderByLabel(page, "Intensity", 0.82));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "texture-intensity-drag");
});
test("browser perf: texture-bleed-drag keeps live slider feedback responsive", async ({ page }) => {
  await openApp(page);
  const result = await measureToolcraftInteraction(page, () => dragToolcraftSliderByLabel(page, "Color bleed", 0.82));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "texture-bleed-drag");
});
test("browser perf: texture-grain-drag keeps live slider feedback responsive", async ({ page }) => {
  await openApp(page);
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "texture-grain-drag", {
    renderScale: rasterAppliers(page).renderScale,
    softness: rasterAppliers(page).softness,
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, productSelector, 2);
  getToolcraftPerformanceStressValue(appPerformance, "texture-grain-drag");
  await dragToolcraftSliderByLabel(page, "Grain", 0.5);
  const result = await measureToolcraftInteraction(page, () => dragToolcraftSliderToPerformanceStressValue(page, "Grain", appPerformance, "texture-grain-drag"));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "texture-grain-drag");
});

test("browser perf: spectrum-cyan-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const input = await sectionTextInput(page, "Spectrum", 0);
  const result = await measureToolcraftInteraction(page, () => input.fill("#00F0D0"));
  await expect(input).toHaveValue("#00F0D0");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "spectrum-cyan-change");
});
test("browser perf: spectrum-blue-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const input = await sectionTextInput(page, "Spectrum", 1);
  const result = await measureToolcraftInteraction(page, () => input.fill("#1948FF"));
  await expect(input).toHaveValue("#1948FF");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "spectrum-blue-change");
});
test("browser perf: spectrum-violet-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const input = await sectionTextInput(page, "Spectrum", 2);
  const result = await measureToolcraftInteraction(page, () => input.fill("#7430F0"));
  await expect(input).toHaveValue("#7430F0");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "spectrum-violet-change");
});
test("browser perf: spectrum-magenta-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const input = await sectionTextInput(page, "Spectrum", 3);
  const result = await measureToolcraftInteraction(page, () => input.fill("#FF1493"));
  await expect(input).toHaveValue("#FF1493");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "spectrum-magenta-change");
});
test("browser perf: spectrum-orange-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const input = await sectionTextInput(page, "Spectrum", 4);
  const result = await measureToolcraftInteraction(page, () => input.fill("#FF4B18"));
  await expect(input).toHaveValue("#FF4B18");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "spectrum-orange-change");
});
test("browser perf: spectrum-yellow-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const input = await sectionTextInput(page, "Spectrum", 5);
  const result = await measureToolcraftInteraction(page, () => input.fill("#FFE438"));
  await expect(input).toHaveValue("#FFE438");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "spectrum-yellow-change");
});

test("browser perf: motion-drift-drag keeps live slider feedback responsive", async ({ page }) => {
  await openApp(page);
  const result = await measureToolcraftInteraction(page, () => dragToolcraftSliderByLabel(page, "Drift", 0.82));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "motion-drift-drag");
});
test("browser perf: motion-breathing-drag keeps live slider feedback responsive", async ({ page }) => {
  await openApp(page);
  const result = await measureToolcraftInteraction(page, () => dragToolcraftSliderByLabel(page, "Breathing", 0.82));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "motion-breathing-drag");
});
test("browser perf: motion-cycles-drag keeps live slider feedback responsive", async ({ page }) => {
  await openApp(page);
  await expectToolcraftDiscreteSliderDragSmoothness(page, "Loop cycles", { maxFrameGapMs: 500, maxInteractionMs: 1800 });
  const result = await measureToolcraftInteraction(page, () => dragToolcraftSliderByLabel(page, "Loop cycles", 0.82));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "motion-cycles-drag");
});

test("browser perf: include-background-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const field = await getToolcraftFieldByLabel(page, "Include");
  const result = await measureToolcraftInteraction(page, () => field.getByRole("switch").click());
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "include-background-change");
});
test("browser perf: background-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const input = await sectionTextInput(page, "Background");
  const result = await measureToolcraftInteraction(page, () => input.fill("#EAF8FF"));
  await expect(input).toHaveValue("#EAF8FF");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "background-change");
});
test("browser perf: image-format-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const section = await exportSection(page, "Image Export");
  const combobox = section.getByRole("combobox").nth(0);
  await combobox.click();
  const result = await measureToolcraftInteraction(page, () => page.locator('[data-slot="select-item"]').filter({ hasText: /^JPG$/ }).click());
  await expect(combobox).toContainText("JPG");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "image-format-change");
});
test("browser perf: video-format-change keeps control changes responsive", async ({ page }) => {
  await openApp(page);
  const section = await exportSection(page, "Video Export");
  const combobox = section.getByRole("combobox").nth(0);
  await combobox.click();
  const result = await measureToolcraftInteraction(page, () => page.locator('[data-slot="select-item"]').filter({ hasText: /^WebM$/ }).click());
  await expect(combobox).toContainText("WebM");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "video-format-change");
});

test("browser perf: WebGL prism flow preview renders within budget", async ({ page }) => {
  await openApp(page);
  await applyToolcraftPerformanceStressFixture(page, appPerformance, "preview-render", rasterAppliers(page));
  getToolcraftPerformanceStressValue(appPerformance, "preview-render");
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, productSelector, 2);
  const result = await measureToolcraftInteraction(page, () => page.waitForTimeout(80));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "preview-render");
});
test("browser perf: Prism flow animation frames stay within budget", async ({ page }) => {
  await openApp(page);
  await applyToolcraftPerformanceStressFixture(page, appPerformance, "animation-frame", motionAppliers(page));
  getToolcraftPerformanceStressValue(appPerformance, "animation-frame");
  await page.getByRole("button", { name: "Play playback" }).first().click();
  const result = await measureToolcraftAnimationFrames(page, 120);
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "animation-frame");
});
test("browser perf: Prism flow coalesces animation during viewport drag", async ({ page }) => {
  await openApp(page);
  await applyToolcraftPerformanceStressFixture(page, appPerformance, "animation-viewport-drag", motionAppliers(page));
  getToolcraftPerformanceStressValue(appPerformance, "animation-viewport-drag");
  await page.getByRole("button", { name: "Play playback" }).first().click();
  const result = await measureToolcraftInteraction(page, () => dragToolcraftCanvasViewport(page, { x: 80, y: 35 }));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "animation-viewport-drag");
});
test("browser perf: Prism flow remains responsive during toolbar zoom stress", async ({ page }) => {
  await openApp(page);
  await applyToolcraftPerformanceStressFixture(page, appPerformance, "viewport-zoom-stress", rasterAppliers(page));
  getToolcraftPerformanceStressValue(appPerformance, "viewport-zoom-stress");
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, productSelector, 2);
  const result = await measureToolcraftInteraction(page, () => zoomToolcraftCanvasViewport(page, "in"));
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "viewport-zoom-stress");
});
test("browser perf: Prism flow timeline playback stays responsive", async ({ page }) => {
  await openApp(page);
  const result = await measureToolcraftInteraction(page, () => page.getByRole("button", { name: "Play playback" }).first().click());
  await expect(page.getByRole("button", { name: "Pause playback" }).first()).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "timeline-playback");
});
test("browser perf: Prism flow timeline scrub stays responsive", async ({ page }) => {
  await openApp(page);
  const timelineField = await getToolcraftFieldByLabel(page, "Timeline");
  const timelineSwitch = timelineField.getByRole("switch");
  if ((await timelineSwitch.getAttribute("data-checked")) !== "true") await timelineSwitch.click();
  const result = await measureToolcraftInteraction(page, () => page.getByRole("slider", { name: "Playback position" }).press("End"));
  await expect(page.getByRole("slider", { name: "Playback position" })).toHaveAttribute("aria-valuenow");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "timeline-scrub");
});
test("browser perf: Prism flow controls keep the viewport stable", async ({ page }) => {
  await openApp(page);
  await expectToolcraftCanvasViewportStable(page, async () => {
    await dragToolcraftSliderByLabel(page, "Opening", 0.75);
  });
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget({ maxFrameGapMs: 16 }, appPerformance, "viewport-stability");
});
test("browser perf: Prism flow PNG export action completes within budget", async ({ page }) => {
  await openApp(page);
  const result = await measureToolcraftInteraction(page, async () => {
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export PNG" }).click();
    await download;
  });
  await expect(page.locator(productSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "export-copy");
});
test("browser perf: 8K prism flow image export completes within budget", async ({ page }) => {
  await openApp(page);
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "image-export-8k", rasterAppliers(page));
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, productSelector, 2);
  getToolcraftPerformanceStressValue(appPerformance, "image-export-8k");
  const section = await exportSection(page, "Image Export");
  const combobox = section.getByRole("combobox").nth(1);
  const result = await measureToolcraftInteraction(page, async () => {
    await combobox.click();
    await page.locator('[data-slot="select-item"]').filter({ hasText: /^8K$/ }).click();
  });
  await expect(combobox).toContainText("8K");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "image-export-8k");
});
test("browser perf: 4K prism flow video export reports frame progress", async ({ page }) => {
  await openApp(page);
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "video-export-4k", rasterAppliers(page));
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, productSelector, 2);
  getToolcraftPerformanceStressValue(appPerformance, "video-export-4k");
  const section = await exportSection(page, "Video Export");
  const combobox = section.getByRole("combobox").nth(1);
  const result = await measureToolcraftInteraction(page, async () => {
    await combobox.click();
    await page.locator('[data-slot="select-item"]').filter({ hasText: /^4K$/ }).click();
  });
  await expect(combobox).toContainText("4K");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "video-export-4k");
});
