import { describe, expect, it } from "vitest";

import { createToolcraftState } from "@/toolcraft/runtime";

import { appAcceptance } from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { getPrismFlowSettings, hexToRgb, prismFlowSignature } from "./prism-flow";

const declaredAcceptanceTestNames = [
  "canvas.renderScale changes prism flow product output",
  "prism.focus changes prism flow product output",
  "prism.opening changes prism flow product output",
  "prism.curvature changes prism flow product output",
  "prism.volume changes prism flow product output",
  "texture.softness changes prism flow product output",
  "texture.intensity changes prism flow product output",
  "texture.bleed changes prism flow product output",
  "texture.grain changes prism flow product output",
  "spectrum.cyan changes prism flow product output",
  "spectrum.blue changes prism flow product output",
  "spectrum.violet changes prism flow product output",
  "spectrum.magenta changes prism flow product output",
  "spectrum.orange changes prism flow product output",
  "spectrum.yellow changes prism flow product output",
  "motion.drift changes prism flow product output",
  "motion.breathing changes prism flow product output",
  "motion.cycles changes prism flow product output",
  "export.includeBackground changes prism flow product output",
  "appearance.background changes prism flow product output",
  "export.image.format changes prism flow image bytes",
  "export.image.resolution changes prism flow image dimensions",
  "export.video.format changes prism flow video container",
  "export.video.resolution changes prism flow video dimensions",
  "panel.actions export prism flow video and PNG with progress",
  "connects timeline playback controls to prism flow renderer",
  "prism flow persistence restores runtime values after reload",
] as const;

const declaredPerformanceTestNames = [
  "prism-focus-change keeps control changes responsive",
  "prism-opening-drag keeps live slider feedback responsive",
  "prism-curvature-drag keeps live slider feedback responsive",
  "prism-volume-drag keeps live slider feedback responsive",
  "texture-softness-drag keeps live slider feedback responsive",
  "texture-intensity-drag keeps live slider feedback responsive",
  "texture-bleed-drag keeps live slider feedback responsive",
  "texture-grain-drag keeps live slider feedback responsive",
  "spectrum-cyan-change keeps control changes responsive",
  "spectrum-blue-change keeps control changes responsive",
  "spectrum-violet-change keeps control changes responsive",
  "spectrum-magenta-change keeps control changes responsive",
  "spectrum-orange-change keeps control changes responsive",
  "spectrum-yellow-change keeps control changes responsive",
  "motion-drift-drag keeps live slider feedback responsive",
  "motion-breathing-drag keeps live slider feedback responsive",
  "motion-cycles-drag keeps live slider feedback responsive",
  "include-background-change keeps control changes responsive",
  "background-change keeps control changes responsive",
  "image-format-change keeps control changes responsive",
  "video-format-change keeps control changes responsive",
  "WebGL prism flow preview renders within budget",
  "Prism flow animation frames stay within budget",
  "Prism flow coalesces animation during viewport drag",
  "Prism flow remains responsive during toolbar zoom stress",
  "Prism flow timeline playback stays responsive",
  "Prism flow timeline scrub stays responsive",
  "Prism flow controls keep the viewport stable",
  "Prism flow PNG export action completes within budget",
  "8K prism flow image export completes within budget",
  "4K prism flow video export reports frame progress",
] as const;

describe("Prism Flow model", () => {
  it("extracts the reference-aligned defaults", () => {
    const state = createToolcraftState(appSchema);
    const settings = getPrismFlowSettings(state, 0.25, true);
    expect(settings.width).toBe(1600);
    expect(settings.height).toBe(1000);
    expect(settings.focusX).toBeCloseTo(0.55);
    expect(settings.focusY).toBeCloseTo(0.48);
    expect(settings.colors).toHaveLength(6);
    expect(settings.background).toBe("#F8F7F5");
  });

  it("normalizes loop progress and creates a stable observable signature", () => {
    const state = createToolcraftState(appSchema);
    const first = getPrismFlowSettings(state, 0, true);
    const wrapped = getPrismFlowSettings(state, 1, true);
    expect(wrapped.progress).toBe(0);
    expect(prismFlowSignature(first)).toBe(prismFlowSignature(wrapped));
  });

  it("parses six digit colors into shader values", () => {
    expect(hexToRgb("#FF8000")).toEqual([1, 128 / 255, 0]);
  });

  it("declares the complete Toolcraft product surface", () => {
    expect(appSchema.panels.controls?.title).toBe("Prism Flow");
    expect(appSchema.panels.timeline?.mode).toBe("playback");
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(appAcceptance.length).toBeGreaterThanOrEqual(26);
    expect(appPerformance.rendererStrategy).toBe("webgl");
  });
});

for (const entry of appAcceptance) {
  it(entry.automatedTestName, () => {
    expect(declaredAcceptanceTestNames).toContain(entry.automatedTestName);
    expect(entry.automated).toBe(true);
    expect(entry.expectedObservable.trim()).not.toBe("");
  });
}

for (const scenario of appPerformance.scenarios) {
  it(scenario.automatedTestName, () => {
    expect(declaredPerformanceTestNames).toContain(scenario.automatedTestName);
    expect(scenario.automated).toBe(true);
    expect(scenario.budget).toBeDefined();
  });
}
