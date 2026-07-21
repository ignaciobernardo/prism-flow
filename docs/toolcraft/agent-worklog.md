# Toolcraft Agent Worklog

## Status

- Mode: product
- Product: Prism Flow
- Folder: `/Users/natochi/projects/old and small projects/tools/prism-flow`
- Original siblings preserved: `path-packets` and `signal-constellation` were not modified.
- Result: implementation, browser acceptance, performance checkpoint, production build, and visual inspection completed.

## Decisions

### Renderer

Decision: Use one analytic WebGL fragment pass for preview and export.

Reason: The supplied references depend on dense diffused pixel fields, a very sharp pinch, translucent color mixing, and fine animated grain at high resolution.

Evidence: `specs/prism-flow-spec.md`, `src/app/prism-flow.ts`, `src/app/product-renderer.tsx`, and the Renderer Technique Decision Matrix in `src/app/app-performance.ts`.

### Timeline

Decision: Use Toolcraft playback timeline with a product-derived 10 second seamless forward loop.

Reason: The output is user-facing procedural motion with video export, so top-level transport must own play, pause, scrub, duration, and loop.

Evidence: `appTransferMode.animationIntent`, `appSchema.panels.timeline`, and renderer use of `getToolcraftTimelineLoopProgress`.

### Layers

Decision: Keep Layers disabled.

Reason: Background, spectral field, and grain are one shader-composited product rather than independently selectable/reorderable objects.

Evidence: `appSchema.panels` contains no layers surface and renderer inventory declares only composited product layers.

### Controls

Decision: Use built-in Vector, Slider, Color, Switch, Select, and Panel Actions controls; no custom controls.

Reason: Focus is direct-authored 2D state, the six colors are unrestricted free colors, scalar optical parameters map to sliders, and final delivery belongs in sticky actions.

Evidence: `starterControlSectionInventory`, `src/app/app-schema.ts`, and `src/app/app-acceptance.ts`.

### Export

Decision: Export PNG/JPG at 2K/4K/8K and MP4/WebM at Current/4K from the same shader; PNG respects Include and video always keeps background.

Reason: Matching preview/export math avoids visual drift while standard Toolcraft sizing/background helpers preserve delivery semantics.

Evidence: `src/app/export.ts`, Background/Image Export/Video Export schema sections, and export acceptance rows.

### Performance

Decision: Reuse the preview GPU program and buffer, change controls through uniforms, freeze non-essential timeline redraw during viewport interaction, and render export on a dedicated WebGL canvas.

Reason: Native 1600x1000 with Grain 40 and Softness 100 is the guaranteed live-motion workload; optional 2x supersampling is verified for static preview/control changes, and exports render directly at their true 2K/4K/8K dimensions.

Evidence: Motion hard limit `{ canvas: 1600x1000, grain: 40, softness: 100 }`; static raster fixture `{ renderScale: 2, grain: 40, softness: 100 }`; both have smooth target ratio 1. Persistent GPU resources, uniform-only invalidation, one full-screen triangle, and interaction coalescing remain in the shipped renderer. `src/app/app-performance.ts` contains the machine-checkable fixtures and pipeline.

## Decision Trail

### Iteration 1 — Product specification and first implementation

Request: Create another Toolcraft app in another folder, matching the supplied prism images with procedural motion, diffused grainy noise, and editable rainbow colors without overwriting previous tools.

Task type: Fresh generated app, custom renderer, controls, timeline, persistence, image/video export, browser QA, and performance checkpoint.

User-visible result: A pale full-canvas optical rainbow converges at a sharp central focus, opens as flowing left ribbons and right rays, moves seamlessly, retains soft grain, and exposes six independent color controls.

Source/reference checked: Two supplied still images showing the Kairos hero treatment and a clean crop of the prismatic field; existing sibling Toolcraft apps were checked only as local assembly/runtime scaffolds.

Reference inputs: `/var/folders/wr/lfsg8cgx5r37km_clmlzc5ph0000gn/T/codex-clipboard-JQgV6T.png` and `/var/folders/wr/lfsg8cgx5r37km_clmlzc5ph0000gn/T/codex-clipboard-21LB78.png`.

Docs/contracts read: `AGENTS.md`; `workflow.md`; runtime-boundary, setup-export, control-selection, layout, timeline-animation, media-upload, performance, reference-study; assembly-workflow; decision-contract; schema-reference; component-rules; acceptance-testing; renderer-technique; performance.

Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `timeline-mode-choice`, `timeline-enabled-behavior`, `controls-product-coverage`, `output-export-required`, `controls-layout-heuristics`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.

Decision: Scaffold a new `prism-flow` sibling, keep `src/toolcraft` unchanged, use WebGL pixel output, enable editable raster render scale and playback timeline, omit Layers/media, and separate all spectral colors from background state.

Alternatives rejected: SVG blur/filter stacks due overlapping filter cost and weaker grain control; Canvas 2D CPU pixels due high-resolution animated workload; image generation because the required output is code-native procedural motion; modifying `signal-constellation` because the user explicitly required another folder.

State/output mapping: Prism Shape, Light Texture, Spectrum, Motion, Background, canvas sizing/render scale, and timeline values become shader uniforms; Image/Video Export values select dimensions and encoders; sticky actions call the same shader export path; localStorage restores values/canvas/panels/timeline.

Files changed: New sibling app files under `prism-flow`, including specs, `src/app`, route identity, app-specific tests, browser tests, and this worklog; copied `src/toolcraft` remains unchanged.

Verification: Typecheck, production build, 45 browser acceptance checks, 34 browser performance checks, and visual inspection completed; the final aggregate gate is recorded below.

Skipped checks: None required for Tier 4; layer/media checks are not applicable because those product surfaces are intentionally absent.

Risks: Browser video container support can fall back from MP4 to WebM when the requested encoder is unavailable.

## Evidence

- Product spec: `specs/prism-flow-spec.md`
- Implementation plan: `specs/prism-flow-plan.md`
- Renderer: `src/app/prism-flow.ts`, `src/app/product-renderer.tsx`
- Schema and export: `src/app/app-schema.ts`, `src/app/export.ts`
- Acceptance/performance matrices: `src/app/app-acceptance.ts`, `src/app/app-performance.ts`
- Source reviewed: both user-supplied prism stills, the standalone product specification, shader source, schema, export implementation, and live browser output.
- Contract applied: runtime-owned schema controls, timeline loop, product-only canvas, persistence, shared preview/export shader math, workload fixtures, and browser product-observable checks.
- Evidence: the inspected live canvas shows an ivory background, a sharp central pinch, six independently colored soft spectral bands, broad bloom, subtle grain, and no black-background regression after color changes.

## Verification

- Run: `npm run typecheck` passed.
- Run: `npm test` passed 275 tests.
- Run: `npm run build` passed.
- Run: `npm run verify:final` passed the aggregate contract, unit, build, and browser gate.
- Browser: all 45 acceptance checks passed in a single serialized WebGL run.
- Run: `npm run verify:perf` passed all 34 Playwright fallback browser performance checks, including native motion, 2x static raster stress, PNG export, 8K image selection, and 4K video selection/progress.
- Fallback reason: no agent-controlled browser was available, so Playwright was used for browser automation and performance measurement.
- Browser: local visual inspection passed at `http://127.0.0.1:3004/`; the product is running there with native 1600x1000 output.

## Risks

- Risk: 2x preview supersampling is intentionally treated as a static inspection mode; the guaranteed procedural-motion workload is the native 1600x1000 canvas.
- Risk: MP4 export depends on browser codec support and may use the implemented WebM fallback.
