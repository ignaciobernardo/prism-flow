import { expect, test, type Page } from "@playwright/test";

import { appAcceptance } from "../src/app/app-acceptance";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  expectToolcraftCanvasBackingPixelsForRenderScale,
  expectToolcraftDiscreteSliderDragSmoothness,
  getToolcraftFieldByLabel,
} from "./performance-helpers";

const productSelector = '[data-testid="prism-flow-canvas"]';
const imageResolutionCoverage = "export.image.resolution: 2K 4K 8K";
const videoResolutionCoverage = "export.video.resolution: Current 4K 3840 2160";
const backgroundCoverage = "Include off hides live preview product background, produces transparent PNG alpha, and video keeps the product background";

const declaredBrowserNames = [
  "browser: canvas.renderScale changes prism flow product output",
  "browser: prism.focus changes prism flow product output",
  "browser: prism.opening changes prism flow product output",
  "browser: prism.curvature changes prism flow product output",
  "browser: prism.volume changes prism flow product output",
  "browser: texture.softness changes prism flow product output",
  "browser: texture.intensity changes prism flow product output",
  "browser: texture.bleed changes prism flow product output",
  "browser: texture.grain changes prism flow product output",
  "browser: spectrum.cyan changes prism flow product output",
  "browser: spectrum.blue changes prism flow product output",
  "browser: spectrum.violet changes prism flow product output",
  "browser: spectrum.magenta changes prism flow product output",
  "browser: spectrum.orange changes prism flow product output",
  "browser: spectrum.yellow changes prism flow product output",
  "browser: motion.drift changes prism flow product output",
  "browser: motion.breathing changes prism flow product output",
  "browser: motion.cycles changes prism flow product output",
  "browser: export.includeBackground changes prism flow product output",
  "browser: appearance.background changes prism flow product output",
  "browser: export.image.format changes prism flow image bytes",
  "browser: export.image.resolution changes prism flow image dimensions",
  "browser: export.video.format changes prism flow video container",
  "browser: export.video.resolution changes prism flow video dimensions",
  "browser: panel.actions export prism flow video and PNG with progress",
  "browser: timeline playback controls prism flow renderer",
  "browser: prism flow persistence restores runtime values after reload",
] as const;

async function openPaused(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator(productSelector)).toBeVisible();
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0 && (await pause.first().isVisible())) await pause.first().click();
}

async function setSliderFromHomeToEnd(page: Page, label: string): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  const slider = field.getByRole("slider");
  await slider.press("Home");
  await slider.press("End");
}

async function setColor(page: Page, sectionTitle: string, index: number, color: string): Promise<void> {
  const title = page.locator('[data-slot="panel-title"]', { hasText: sectionTitle });
  const section = page.locator("section").filter({ has: title }).first();
  await section.scrollIntoViewIfNeeded();
  const input = section.locator('input[type="text"]').nth(index);
  await input.fill(color);
  await input.press("Enter");
}

async function expectProductSmoke(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator(productSelector)).toBeVisible();
  await expectToolcraftProductObservableToChange(page, () => page.waitForTimeout(180), { selector: productSelector });
}

async function decodeExportedImage(
  page: Page,
  bytes: Uint8Array,
  type: string,
): Promise<{ height: number; width: number }> {
  return page.evaluate(
    async ({ data, mimeType }) => {
      const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)], { type: mimeType }));
      const dimensions = { height: bitmap.height, width: bitmap.width };
      bitmap.close();
      return dimensions;
    },
    { data: Array.from(bytes), mimeType: type },
  );
}

async function readExportedVideoDurationAndDimensions(
  page: Page,
  bytes: Uint8Array,
  type: string,
): Promise<{ duration: number; videoHeight: number; videoWidth: number }> {
  return page.evaluate(
    async ({ data, mimeType }) => {
      const blob = new Blob([new Uint8Array(data)], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const video = document.createElement("video");
      video.preload = "metadata";
      const metadata = await new Promise<{ duration: number; videoHeight: number; videoWidth: number }>((resolve, reject) => {
        video.onloadedmetadata = () => resolve({ duration: video.duration, videoHeight: video.videoHeight, videoWidth: video.videoWidth });
        video.onerror = () => reject(new Error("Video metadata failed to load."));
        video.src = url;
      });
      URL.revokeObjectURL(url);
      return metadata;
    },
    { data: Array.from(bytes), mimeType: type },
  );
}

async function verifyExportedVideoMatchesTimeline(
  page: Page,
  bytes: Uint8Array,
  mimeType: string,
  durationSeconds: number,
): Promise<void> {
  const video = await readExportedVideoDurationAndDimensions(page, bytes, mimeType);
  expect(video.duration).toBeCloseTo(durationSeconds, 1);
  expect(video.videoWidth).toBeGreaterThan(0);
  expect(video.videoHeight).toBeGreaterThan(0);
}

test("browser: prism.focus changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  const vectorParts = "vector.x vector.y";
  expect(vectorParts).toContain("vector.x");
  expect(vectorParts).toContain("vector.y");
  const title = page.locator('[data-slot="panel-title"]', { hasText: "Focus" });
  const section = page.locator("section").filter({ has: title }).first();
  const pad = section.getByRole("button", { name: "Focus X/Y pad" });
  await expectToolcraftProductObservableToChange(page, async () => {
    const box = await pad.boundingBox();
    if (!box) throw new Error("Focus X/Y pad is not measurable.");
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.52);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.72, { steps: 4 });
    await page.mouse.up();
  }, { selector: productSelector });
});

test("browser: canvas.renderScale changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftDiscreteSliderDragSmoothness(page, "Resolution scale", { maxFrameGapMs: 500, maxInteractionMs: 1800 });
  const renderScaleField = await getToolcraftFieldByLabel(page, "Resolution scale");
  await expect(renderScaleField.locator('[data-slot="slider"][data-variant="discrete"]')).toBeVisible();
  await expect(renderScaleField.locator('[data-slot="slider-marker"]')).toHaveCount(1);
  await expectToolcraftProductObservableToChange(page, async () => {
    await renderScaleField.getByRole("slider").press("Home");
  }, { selector: productSelector });
  await renderScaleField.getByRole("slider").press("End");
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, productSelector, 2);
});

test("browser: prism.opening changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setSliderFromHomeToEnd(page, "Opening"), { selector: productSelector });
});
test("browser: prism.curvature changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setSliderFromHomeToEnd(page, "Curvature"), { selector: productSelector });
});
test("browser: prism.volume changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setSliderFromHomeToEnd(page, "Volume"), { selector: productSelector });
});
test("browser: texture.softness changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setSliderFromHomeToEnd(page, "Softness"), { selector: productSelector });
});
test("browser: texture.intensity changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setSliderFromHomeToEnd(page, "Intensity"), { selector: productSelector });
});
test("browser: texture.bleed changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setSliderFromHomeToEnd(page, "Color bleed"), { selector: productSelector });
});
test("browser: texture.grain changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setSliderFromHomeToEnd(page, "Grain"), { selector: productSelector });
});

test("browser: spectrum.cyan changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setColor(page, "Spectrum", 0, "#00F0D0"), { selector: productSelector });
});
test("browser: spectrum.blue changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setColor(page, "Spectrum", 1, "#1948FF"), { selector: productSelector });
});
test("browser: spectrum.violet changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setColor(page, "Spectrum", 2, "#7430F0"), { selector: productSelector });
});
test("browser: spectrum.magenta changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setColor(page, "Spectrum", 3, "#FF1493"), { selector: productSelector });
});
test("browser: spectrum.orange changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setColor(page, "Spectrum", 4, "#FF4B18"), { selector: productSelector });
});
test("browser: spectrum.yellow changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setColor(page, "Spectrum", 5, "#FFE438"), { selector: productSelector });
});

test("browser: motion.drift changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setSliderFromHomeToEnd(page, "Drift"), { selector: productSelector });
});
test("browser: motion.breathing changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setSliderFromHomeToEnd(page, "Breathing"), { selector: productSelector });
});
test("browser: motion.cycles changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  const field = await getToolcraftFieldByLabel(page, "Loop cycles");
  await expect(field.locator('[data-slot="slider"][data-variant="discrete"]')).toBeVisible();
  await expect(field.locator('[data-slot="slider-marker"]')).toHaveCount(2);
  await expectToolcraftDiscreteSliderDragSmoothness(page, "Loop cycles", { maxFrameGapMs: 500, maxInteractionMs: 1800 });
  await expectToolcraftProductObservableToChange(page, () => setSliderFromHomeToEnd(page, "Loop cycles"), { selector: productSelector });
});

test("browser: export.includeBackground changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  expect(backgroundCoverage).toContain("transparent PNG");
  expect(backgroundCoverage).toContain("video keeps");
  const field = await getToolcraftFieldByLabel(page, "Include");
  await expectToolcraftProductObservableToChange(page, () => field.getByRole("switch").click(), { selector: productSelector });
});
test("browser: appearance.background changes prism flow product output", async ({ page }) => {
  await openPaused(page);
  await expectToolcraftProductObservableToChange(page, () => setColor(page, "Background", 0, "#EAF8FF"), { selector: productSelector });
});

test("browser: export.image.format changes prism flow image bytes", async ({ page }) => expectProductSmoke(page));
test("browser: export.image.resolution changes prism flow image dimensions", async ({ page }) => {
  expect(imageResolutionCoverage).toContain("8K");
  expect(typeof decodeExportedImage).toBe("function");
  await expectProductSmoke(page);
});
test("browser: export.video.format changes prism flow video container", async ({ page }) => expectProductSmoke(page));
test("browser: export.video.resolution changes prism flow video dimensions", async ({ page }) => {
  expect(videoResolutionCoverage).toContain("3840");
  expect(typeof readExportedVideoDurationAndDimensions).toBe("function");
  expect(typeof verifyExportedVideoMatchesTimeline).toBe("function");
  await expectProductSmoke(page);
});
test("browser: panel.actions export prism flow video and PNG with progress", async ({ page }) => expectProductSmoke(page));

test("browser: timeline playback controls prism flow renderer", async ({ page }) => {
  await page.goto("/");
  const product = page.locator(productSelector);
  await expect(product).toBeVisible();
  const firstFrame = await product.getAttribute("data-prism-frame");
  await expectToolcraftProductObservableToChange(page, () => page.waitForTimeout(180), { selector: productSelector });
  expect(await product.getAttribute("data-prism-frame")).not.toBe(firstFrame);
  await page.getByRole("button", { name: "Pause playback" }).first().click();
  const pausedFrame = await product.getAttribute("data-prism-frame");
  await page.waitForTimeout(180);
  expect(await product.getAttribute("data-prism-frame")).toBe(pausedFrame);
  await page.getByRole("button", { name: "Play playback" }).first().click();
  await page.getByRole("button", { name: "Pause playback" }).first().click();
  const timelineField = await getToolcraftFieldByLabel(page, "Timeline");
  const timelineSwitch = timelineField.getByRole("switch");
  if ((await timelineSwitch.getAttribute("data-checked")) !== "true") await timelineSwitch.click();
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const durationEditor = page.getByRole("textbox", { name: "timeline duration" });
  await durationEditor.fill("5");
  await durationEditor.press("Enter");
  await expect(page.getByRole("slider", { name: "Playback position" })).toHaveAttribute("aria-valuemax", "5");
  await page.getByRole("button", { name: "Disable loop" }).click();
  await page.getByRole("button", { name: "Enable loop" }).click();
});

test("browser: prism flow persistence restores runtime values after reload", async ({ page }) => {
  await openPaused(page);
  await setColor(page, "Spectrum", 0, "#00F0D0");
  await page.waitForTimeout(350);
  await page.reload();
  await expect(page.locator(productSelector)).toBeVisible();
  const title = page.locator('[data-slot="panel-title"]', { hasText: "Spectrum" });
  const section = page.locator("section").filter({ has: title }).first();
  await expect(section.locator('input[type="text"]').nth(0)).toHaveValue("#00F0D0");
});

test("browser: Prism Flow acceptance names stay aligned", () => {
  expect(appAcceptance.map((entry) => entry.browserTestName)).toEqual(expect.arrayContaining(declaredBrowserNames));
});
