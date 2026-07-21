import type { ResolvedToolcraftAppSchema } from "@/toolcraft/runtime";

import * as contract from "./app-acceptance-contract";
import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./app-acceptance-contract";
import { appSchema } from "./app-schema";

export * from "./app-acceptance-contract";

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence: "Prism Flow composes sine and cosine optical drift over one product-derived ten-second phase; phase 0 and phase 1 are identical while motion advances forward.",
      seconds: 10,
      source: "product-derived",
    },
    mode: "timeline-playback",
  },
  mode: "new-toolcraft-app",
};

export const appProductReadiness: ToolcraftProductReadiness = {
  mode: "product",
  productName: "Prism Flow",
  productSummary: "A procedural prismatic light-field generator with a central optical pinch, diffused rainbow ribbons, animated grain, timeline motion, and high-resolution export.",
  requestedBehavior: "Create a separate Toolcraft app matching the supplied pale prismatic references, preserve blurred grainy noise during seamless procedural motion, and let the user change every rainbow color without affecting the background.",
};

function productControl(
  target: string,
  componentType: string,
  label: string,
  expectedObservable: string,
  extras: Partial<ToolcraftComponentAcceptance> = {},
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: `${target} changes prism flow product output`,
    browser: true,
    browserTestName: `browser: ${target} changes prism flow product output`,
    componentType,
    evidence: "product-output",
    expectedObservable,
    fixture: "Prism Flow paused at a fixed timeline frame",
    id: target,
    kind: "control",
    target,
    userAction: componentType === "slider"
      ? `Drag the visible ${label} slider and verify the prismatic canvas changes while dragging.`
      : `Change ${label} through the visible Toolcraft control and compare rendered pixels.`,
    ...extras,
  };
}

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  productControl("canvas.renderScale", "slider", "Resolution scale", "The HTML canvas backing changes from 1x to 2x while visible output size remains stable."),
  productControl("prism.focus", "vector", "Focus", "Both axes move the sharp optical pinch and attached bands.", { controlPartCoverage: ["vector.x", "vector.y"] }),
  productControl("prism.opening", "slider", "Opening", "Rainbow bands open through wider or narrower angles on both sides."),
  productControl("prism.curvature", "slider", "Curvature", "The broad left ribbons acquire more or less wave bend."),
  productControl("prism.volume", "slider", "Volume", "The colored optical body expands while the focal pinch remains sharp."),
  productControl("texture.softness", "slider", "Softness", "Band edges become more or less diffused at unchanged native backing size."),
  productControl("texture.intensity", "slider", "Intensity", "Spectral saturation changes without turning the pale background black."),
  productControl("texture.bleed", "slider", "Color bleed", "The translucent haze around the core bands grows or recedes."),
  productControl("texture.grain", "slider", "Grain", "Fine pixel variance changes inside the diffused color field."),
  productControl("spectrum.cyan", "color", "Cyan swatch", "The cyan rays change color while the background remains independently pale."),
  productControl("spectrum.blue", "color", "Blue swatch", "The blue rays change color while other rainbow roles remain intact."),
  productControl("spectrum.violet", "color", "Violet swatch", "The violet ribbon changes color in preview and export."),
  productControl("spectrum.magenta", "color", "Magenta swatch", "The magenta ribbon changes color in preview and export."),
  productControl("spectrum.orange", "color", "Orange swatch", "The orange ribbon changes color in preview and export."),
  productControl("spectrum.yellow", "color", "Yellow swatch", "The yellow ray changes color in preview and export."),
  productControl("motion.drift", "slider", "Drift", "Timeline frames show stronger or weaker lateral color drift."),
  productControl("motion.breathing", "slider", "Breathing", "Timeline frames show stronger or weaker optical expansion."),
  productControl("motion.cycles", "slider", "Loop cycles", "The same seamless timeline contains the selected number of forward optical cycles."),
  productControl("export.includeBackground", "switch", "Include", "Disabling Include hides the live preview product background, makes PNG output transparent, and keeps video output with the product background."),
  productControl("appearance.background", "color", "Background", "The pale product background changes independently from all six spectrum colors."),
  {
    automated: true,
    automatedTestName: "export.image.format changes prism flow image bytes",
    browser: true,
    browserTestName: "browser: export.image.format changes prism flow image bytes",
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable: "PNG and JPG produce matching image MIME types and non-empty encoded output.",
    fixture: "Image Export Format set to PNG and JPG",
    id: "export.image.format",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "export.image.format",
    userAction: "Select PNG and JPG and inspect downloaded bytes.",
  },
  {
    automated: true,
    automatedTestName: "export.image.resolution changes prism flow image dimensions",
    browser: true,
    browserTestName: "browser: export.image.resolution changes prism flow image dimensions",
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable: "2K, 4K, and 8K exports decode with their selected long-edge dimensions.",
    fixture: "Image Export Resolution set to 2K, 4K, and 8K",
    id: "export.image.resolution",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "export.image.resolution",
    userAction: "Select multiple image resolutions, export, and compare decoded dimensions.",
  },
  {
    automated: true,
    automatedTestName: "export.video.format changes prism flow video container",
    browser: true,
    browserTestName: "browser: export.video.format changes prism flow video container",
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable: "MP4 and WebM select a supported MIME container with safe WebM fallback.",
    fixture: "Video Export Format set to MP4 and WebM",
    id: "export.video.format",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "export.video.format",
    userAction: "Select MP4 and WebM, export, and inspect the resulting MIME type.",
  },
  {
    automated: true,
    automatedTestName: "export.video.resolution changes prism flow video dimensions",
    browser: true,
    browserTestName: "browser: export.video.resolution changes prism flow video dimensions",
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable: "Current uses even canvas dimensions and 4K fits inside 3840x2160 with preserved aspect ratio.",
    fixture: "Video Export Resolution set to Current and 4K",
    id: "export.video.resolution",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "export.video.resolution",
    userAction: "Select Current and 4K, export, and compare video metadata.",
  },
  {
    actionCoverage: ["export.video", "export.png"],
    automated: true,
    automatedTestName: "panel.actions export prism flow video and PNG with progress",
    browser: true,
    browserTestName: "browser: panel.actions export prism flow video and PNG with progress",
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable: "Both sticky actions return encoded shader output while determinate progress settles.",
    fixture: "Prism Flow with a short edited timeline duration",
    id: "panel.actions",
    kind: "control",
    target: "panel.actions",
    userAction: "Click Export Video and Export PNG and observe progress until download begins.",
  },
  {
    automated: true,
    automatedTestName: "connects timeline playback controls to prism flow renderer",
    browser: true,
    browserTestName: "browser: timeline playback controls prism flow renderer",
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable: "Play, pause, scrub, duration, and loop change optical motion; motion advances in one direction without mirror, yoyo, ping-pong, or reverse fallbacks, first and last frames stitch without a visible jump, and the same seam holds after changing timeline duration.",
    fixture: "Prism Flow ten-second playback at first, midpoint, last, and wrapped frames",
    id: "timeline.playback",
    kind: "runtime",
    target: "timeline.playback",
    timelineCoverage: "playback",
    timelinePlaybackCoverage: ["pause-resume", "scrub", "duration", "loop", "rendered-frame"],
    userAction: "Play, pause, scrub, edit duration, and compare first/last/wrapped rendered frames.",
  },
  {
    automated: true,
    automatedTestName: "prism flow persistence restores runtime values after reload",
    browser: true,
    browserTestName: "browser: prism flow persistence restores runtime values after reload",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable: "A changed rainbow color and its rendered optical field return after a real reload.",
    fixture: "Cyan changed before reload",
    id: "runtime.persistence",
    kind: "runtime",
    persistenceCoverage: "reload",
    target: "runtime.persistence",
    userAction: "Change Cyan, wait for persistence, reload, and verify the restored color and output.",
  },
];

export const starterControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  { entity: "Optical focal point", groupingReason: "The direct-authored two-axis focus owns its square spatial editor and moves the optical pinch.", targets: ["prism.focus"], title: "Focus" },
  { entity: "Optical prism geometry", groupingReason: "Opening, Curvature, and Volume jointly define the converging rainbow field around the focus.", targets: ["prism.opening", "prism.curvature", "prism.volume"], title: "Prism Shape" },
  { entity: "Diffused optical surface", groupingReason: "Softness, Intensity, Color bleed, and Grain jointly define the luminous grainy texture.", targets: ["texture.softness", "texture.intensity", "texture.bleed", "texture.grain"], title: "Light Texture" },
  { entity: "Editable rainbow", groupingReason: "Six free colors define the complete spectral bank without constraining users to design tokens.", targets: ["spectrum.cyan", "spectrum.blue", "spectrum.violet", "spectrum.magenta", "spectrum.orange", "spectrum.yellow"], title: "Spectrum" },
  { entity: "Procedural optical motion", groupingReason: "Drift, Breathing, and Loop cycles jointly define seamless timeline movement.", targets: ["motion.drift", "motion.breathing", "motion.cycles"], title: "Motion" },
  { entity: "Output background", groupingReason: "The mandatory Background section pairs Include with the unlabeled product background color.", targets: ["export.includeBackground", "appearance.background"], title: "Background" },
  { groupingReason: "Format and Resolution jointly configure still image delivery.", targets: ["export.image.format", "export.image.resolution"], title: "Image Export", workflowStage: "Still image delivery" },
  { groupingReason: "Format and Resolution jointly configure animated delivery.", targets: ["export.video.format", "export.video.resolution"], title: "Video Export", workflowStage: "Animated delivery" },
];

export function validateToolcraftAcceptanceCoverage(
  schema: ResolvedToolcraftAppSchema = appSchema,
  acceptance: readonly ToolcraftComponentAcceptance[] = appAcceptance,
  transferMode?: ToolcraftTransferMode,
  sectionInventory?: readonly ToolcraftControlSectionInventoryEntry[],
): string[] {
  return contract.validateToolcraftAcceptanceCoverage(
    schema,
    acceptance,
    transferMode ?? (schema === appSchema ? appTransferMode : undefined),
    sectionInventory ?? (schema === appSchema ? starterControlSectionInventory : undefined),
  );
}
