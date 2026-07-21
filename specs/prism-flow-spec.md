# Prism Flow Product Spec

Verification tier: Tier 4

Reason: This is the first working version of a new generated Toolcraft product with a custom animated WebGL renderer, editable output sizing, timeline transport, persistence, and image/video export.

Run: `npm install`, `npm run verify:final`, the first-working browser performance checkpoint, visual browser inspection, and `npm run dev`.

Skip: Layers and media lifecycle checks because the product is one procedural output with no imported source assets or independently editable objects.

## Product goal

Create a standalone procedural prism-motion generator matching the supplied still references: a pale warm-white field, broad translucent cyan/blue/magenta/orange/yellow bands, a sharp central convergence point, expanding rays, soft optical blur, and fine animated grain. The result must remain editable, seamlessly animated, and exportable.

## Visible output

- Default canvas: 1600 x 1000 editable output.
- A single full-canvas procedural raster field.
- The left field forms broad organic waves that collapse into a focal pinch near 55% width and 52% height.
- The right field opens from the pinch as luminous fan-shaped rays.
- Softness is analytic in the shader rather than a low-resolution blur pass.
- Fine grain and subtle chromatic noise remain visible without darkening the white background.

## Control Section Inventory

1. **Prism Shape** — focal position, opening, curvature, and field volume define the optical geometry.
2. **Light Texture** — softness, intensity, grain, and color bleed define the diffused grainy surface.
3. **Spectrum** — six free-form colors define the editable rainbow.
4. **Motion** — drift, breathing, and loop cycles define seamless procedural motion.
5. **Background** — required Include switch and background color.
6. **Image Export** — format and resolution.
7. **Video Export** — format and resolution.

## Control decisions

- Focal point uses built-in `vector`: it is a stable direct-authored two-axis parameter.
- Opening, curvature, volume, softness, intensity, grain, bleed, drift, breathing, and cycles use built-in sliders.
- The six rainbow roles use built-in free-form `color` controls; `palette` is rejected because these are not constrained design tokens.
- No custom controls are required.
- Slider steps are stepped-continuous except loop cycles, which is visual-discrete.

## Animation Intent Inventory

- Mode: playback timeline.
- Loop duration: 10 seconds, product-derived for a slow optical breathing cycle.
- The renderer reads Toolcraft loop progress; sine/cosine phase terms stitch at 0 and 1.
- Motion remains forward-only. No mirror, yoyo, or ping-pong behavior.
- Timeline transport owns play, pause, scrub, loop, and edited duration.
- During viewport interaction, the preview freezes non-essential animation frames and resumes at current timeline time without changing playback state.

## Renderer Technique Decision Matrix

- `sourceRepresentation`: schema values and timeline progress.
- `productRepresentation`: full-canvas analytic spectral radiance field.
- `previewRenderer`: WebGL fragment shader on native canvas backing pixels.
- `exportRenderer`: the same WebGL shader rendered at the selected image/video output size.
- `rendererWorkload`: one full-screen fragment pass with gaussian ribbon/ray fields and procedural noise.
- `rendererStrategy`: WebGL.
- `whyNotAlternativeStrategies`: SVG filters would require many overlapping blurred shapes and costly filter regions; Canvas 2D would require large gradient stacks or CPU pixel processing and would not preserve the same analytic grain at 4K/8K.
- `fidelityRisks`: an overly hard field reads as polygonal rays; excessive grain dirties the white background; additive mixing can clip colors.
- `performanceRisks`: 8K still export and 4K video are fill-rate and encoding workloads; GPU program and buffers must be reused.

## Renderer Layer Inventory

- `background`: configurable pale product background inside the shader.
- `product-foreground`: spectral ribbon/ray field plus grain.
- `export-composite`: same shader at delivery dimensions.
- No editing handles and no layer panel.

## Render Pipeline Inventory

1. `shader-program` — compile/link once per WebGL context; cached by shader source.
2. `spectral-preview` — update uniforms and draw one full-screen triangle/quad; invalidated by prism, texture, spectrum, background, canvas, and timeline values.
3. `export-composite` — create an export surface and render the same shader at final dimensions; invalidated only by export request and output settings.

Viewport pan/zoom never rebuilds the shader program. Slider drags only update uniforms. Timeline frames only redraw the spectral pass.

## Persistence, export, and delivery

- Persist values, canvas, panels, and timeline to `toolcraft:prism-flow:state:v1`.
- PNG respects Background Include and supports transparency; JPG always composites the background.
- Video always includes the background.
- Image formats: PNG, JPG. Resolutions: 2K, 4K, 8K.
- Video formats: MP4 with supported fallback, WebM. Resolutions: Current, 4K.
- Sticky actions: Export Video and Export PNG.

## Acceptance focus

- Every control changes rendered pixels through the real UI.
- Color changes alter the shader without changing the background or making lines black.
- Timeline play/pause/scrub and duration drive a seamless loop.
- Canvas backing respects selected render scale.
- Export bytes, dimensions, transparency/background behavior, and progress are covered.
- Browser visual QA compares default composition, focal pinch, diffused bands, and grain against the supplied references.

