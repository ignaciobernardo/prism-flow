# Prism Flow Implementation Plan

1. Replace `src/app/app-schema.ts` with the Prism Shape, Light Texture, Spectrum, Motion, Background, Image Export, and Video Export schema; enable editable output, raster render scale, playback timeline, persistence, and sticky export actions.
2. Add `src/app/prism-flow.ts` for typed state extraction, color parsing, timeline-safe settings, and shader uniform helpers, with focused unit tests in `src/app/prism-flow.test.ts`.
3. Replace `src/app/product-renderer.tsx` with a lifecycle-safe WebGL canvas that compiles once, updates uniforms, draws at native backing size, exposes observable frame/signature metadata, and coalesces animation during viewport interaction.
4. Replace `src/app/export.ts` so still and video delivery render the identical shader through standard Toolcraft sizing/background helpers and report async progress.
5. Replace `src/app/app-acceptance.ts` and `src/app/app-performance.ts` with Prism Flow product matrices, renderer technique and pipeline inventories, workload fixtures, and matching browser test names.
6. Update `src/routes/index.tsx`, `index.html`, `package.json`, and lockfile identity to Prism Flow.
7. Replace app-specific Playwright specs with Prism Flow UI, renderer, timeline, persistence, export, native backing, and performance checks; align the generated acceptance test control-order assertion.
8. Replace `docs/toolcraft/agent-worklog.md` with product-mode decision evidence for the supplied image references, renderer, timeline, controls, export, and verification.
9. Run `npm install`, unit/type/build/browser gates, diagnose any failures with systematic debugging, run the first-working performance checkpoint, inspect a real browser screenshot, and start the final dev server without touching sibling apps.

