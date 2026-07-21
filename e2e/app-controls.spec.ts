import { expect, test } from "@playwright/test";

const productSelector = '[data-testid="prism-flow-canvas"]';

test("browser: Prism Flow opens as a product Toolcraft shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
  await expect(page.locator(productSelector)).toBeVisible();
  await expect(page.getByText("Prism Shape", { exact: true })).toBeVisible();
  await expect(page.getByText("Light Texture", { exact: true })).toBeVisible();
  await expect(page.getByText("Spectrum", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Play playback|Pause playback/ })).toHaveCount(1);
  const exportPng = page.getByRole("button", { name: "Export PNG" });
  const exportVideo = page.getByRole("button", { name: "Export Video" });
  await exportPng.scrollIntoViewIfNeeded();
  await expect(exportPng).toBeVisible();
  await expect(exportVideo).toBeVisible();
});

test("browser: Prism Flow canvas preserves native output dimensions", async ({
  page,
}) => {
  await page.goto("/");

  const outputWidth = 1600;
  const outputHeight = 1000;
  const preview = page.locator(productSelector);
  const editableCanvas = page.locator("[data-toolcraft-editable-canvas]");
  await expect(preview).toBeVisible();

  const { previewHeight, previewWidth, canvasHeight, canvasWidth } =
    await preview.evaluate((svg, canvas) => {
      const editable = canvas as HTMLElement;
      return {
        canvasHeight: editable.clientHeight,
        canvasWidth: editable.clientWidth,
        previewHeight: svg.clientHeight,
        previewWidth: svg.clientWidth,
      };
    }, await editableCanvas.elementHandle());

  expect(previewWidth).toBe(outputWidth);
  expect(previewHeight).toBe(outputHeight);
  expect(canvasWidth).toBe(outputWidth);
  expect(canvasHeight).toBe(outputHeight);
  await expect(preview).toHaveAttribute("width", "1600");
  await expect(preview).toHaveAttribute("height", "1000");
});
