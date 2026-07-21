import type { ToolcraftState } from "@/toolcraft/runtime";

export type PrismFlowSettings = {
  background: string;
  bleed: number;
  breathing: number;
  colors: readonly [string, string, string, string, string, string];
  curvature: number;
  cycles: number;
  drift: number;
  focusX: number;
  focusY: number;
  grain: number;
  height: number;
  includeBackground: boolean;
  intensity: number;
  opening: number;
  progress: number;
  softness: number;
  volume: number;
  width: number;
};

const DEFAULT_COLORS = [
  "#19CBE3",
  "#2865D8",
  "#8C43CE",
  "#F02A9D",
  "#FF7138",
  "#FFC94A",
] as const;

function numberValue(state: ToolcraftState, target: string, fallback: number): number {
  const value = Number(state.values[target]);
  return Number.isFinite(value) ? value : fallback;
}

function colorValue(state: ToolcraftState, target: string, fallback: string): string {
  const value = state.values[target];
  const candidate =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "hex" in value && typeof value.hex === "string"
        ? value.hex
        : "";
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate.toUpperCase() : fallback;
}

function vectorNumber(value: unknown, axis: "x" | "y", fallback: number): number {
  if (!value || typeof value !== "object" || !(axis in value)) return fallback;
  const parsed = Number((value as Record<string, unknown>)[axis]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getPrismFlowSettings(
  state: ToolcraftState,
  progress: number,
  includeBackground: boolean,
): PrismFlowSettings {
  const focus = state.values["prism.focus"];
  return {
    background: colorValue(state, "appearance.background", "#F8F7F5"),
    bleed: numberValue(state, "texture.bleed", 62) / 100,
    breathing: numberValue(state, "motion.breathing", 42) / 100,
    colors: [
      colorValue(state, "spectrum.cyan", DEFAULT_COLORS[0]),
      colorValue(state, "spectrum.blue", DEFAULT_COLORS[1]),
      colorValue(state, "spectrum.violet", DEFAULT_COLORS[2]),
      colorValue(state, "spectrum.magenta", DEFAULT_COLORS[3]),
      colorValue(state, "spectrum.orange", DEFAULT_COLORS[4]),
      colorValue(state, "spectrum.yellow", DEFAULT_COLORS[5]),
    ],
    curvature: numberValue(state, "prism.curvature", 64) / 100,
    cycles: Math.round(numberValue(state, "motion.cycles", 1)),
    drift: numberValue(state, "motion.drift", 46) / 100,
    focusX: Math.min(0.72, Math.max(0.35, 0.5 + vectorNumber(focus, "x", 0.1) * 0.5)),
    focusY: Math.min(0.72, Math.max(0.28, 0.5 - vectorNumber(focus, "y", 0.04) * 0.5)),
    grain: numberValue(state, "texture.grain", 18) / 100,
    height: Math.max(1, Math.round(state.canvas.size.height)),
    includeBackground,
    intensity: numberValue(state, "texture.intensity", 92) / 100,
    opening: numberValue(state, "prism.opening", 78) / 100,
    progress: ((progress % 1) + 1) % 1,
    softness: numberValue(state, "texture.softness", 74) / 100,
    volume: numberValue(state, "prism.volume", 82) / 100,
    width: Math.max(1, Math.round(state.canvas.size.width)),
  };
}

export function hexToRgb(color: string): readonly [number, number, number] {
  const normalized = /^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : "000000";
  return [
    Number.parseInt(normalized.slice(0, 2), 16) / 255,
    Number.parseInt(normalized.slice(2, 4), 16) / 255,
    Number.parseInt(normalized.slice(4, 6), 16) / 255,
  ];
}

export function prismFlowSignature(settings: PrismFlowSettings): string {
  return [
    settings.focusX.toFixed(3),
    settings.focusY.toFixed(3),
    settings.opening.toFixed(3),
    settings.curvature.toFixed(3),
    settings.volume.toFixed(3),
    settings.softness.toFixed(3),
    settings.intensity.toFixed(3),
    settings.bleed.toFixed(3),
    settings.grain.toFixed(3),
    settings.drift.toFixed(3),
    settings.breathing.toFixed(3),
    settings.cycles,
    ...settings.colors,
    settings.background,
    settings.includeBackground,
    settings.progress.toFixed(4),
  ].join("|");
}

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform vec2 u_focus;
uniform vec4 u_shape;
uniform vec4 u_texture;
uniform vec4 u_motion;
uniform vec3 u_background;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
uniform vec3 u_c5;
uniform float u_include_background;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float ribbon(vec2 p, float leftOffset, float rightOffset, float index) {
  float rightSide = step(0.0, p.x);
  float leftExtent = clamp(-p.x / max(u_focus.x, 0.001), 0.0, 1.25);
  float rightExtent = clamp(p.x / max(1.0 - u_focus.x, 0.001), 0.0, 1.25);
  float extent = mix(leftExtent, rightExtent, rightSide);
  float breath = 1.0 + sin(u_motion.z * 6.283185 + index * 0.72) * u_motion.y * 0.095;
  float offset = mix(leftOffset, rightOffset, rightSide) * u_shape.x * breath;
  float center = offset * pow(extent, 0.76);
  float leftWave = sin(leftExtent * 8.2 + index * 1.31 + u_motion.z * 6.283185) * 0.076;
  leftWave += sin(leftExtent * 15.6 - index * 0.83 - u_motion.z * 4.712389) * 0.024;
  center += (1.0 - rightSide) * leftWave * u_shape.y * pow(leftExtent, 0.72);
  center += sin(u_motion.z * 6.283185 + index * 1.77) * u_motion.x * 0.018 * extent;
  center += rightSide * sin(rightExtent * 2.7 + index + u_motion.z * 3.14159) * 0.007 * u_shape.y * rightExtent;

  float width = 0.0022 + pow(extent, 0.80) * (0.017 + u_shape.z * 0.045);
  width *= 0.76 + u_shape.w * 0.56;
  float distanceToBand = abs(p.y - center);
  float coreDistance = distanceToBand / max(width, 0.001);
  float coreSquare = coreDistance * coreDistance;
  float core = 1.0 / (1.0 + coreSquare * 0.85 + coreSquare * coreSquare * 0.22);
  float haloWidth = width * (1.9 + u_texture.y * 1.45);
  float haloDistance = distanceToBand / max(haloWidth, 0.001);
  float haloSquare = haloDistance * haloDistance;
  float halo = 1.0 / (1.0 + haloSquare * 0.95 + haloSquare * haloSquare * 0.25);
  float edgeNoise = hash21(v_uv * u_resolution * 0.055 + index * 31.7 + u_motion.z * 17.0) - 0.5;
  return max(0.0, core * (0.90 + edgeNoise * u_texture.z * 0.22) + halo * (0.08 + u_texture.y * 0.14));
}

void main() {
  vec2 uv = v_uv;
  vec2 p = uv - u_focus;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  p.y *= min(aspect / 1.6, 1.12);

  float a0 = ribbon(p, -0.40, -0.37, 0.0);
  float a1 = ribbon(p, -0.27, -0.23, 1.0);
  float a2 = ribbon(p, -0.14, -0.09, 2.0);
  float a3 = ribbon(p,  0.015, 0.035, 3.0);
  float a4 = ribbon(p,  0.18,  0.19, 4.0);
  float a5 = ribbon(p,  0.32,  0.35, 5.0);

  float total = a0 + a1 + a2 + a3 + a4 + a5;
  vec3 spectral = (u_c0 * a0 + u_c1 * a1 + u_c2 * a2 + u_c3 * a3 + u_c4 * a4 + u_c5 * a5) / max(total, 0.0001);
  float alpha = (1.0 - exp(-total * 0.84 * u_texture.x)) * 0.95;
  vec2 grainCell = floor(gl_FragCoord.xy * 0.25);
  float paperNoise = hash21(grainCell + u_motion.z * 997.0) - 0.5;
  float chromaNoise = hash21(grainCell.yx * 0.73 + u_motion.z * 619.0) - 0.5;
  spectral += vec3(paperNoise, chromaNoise, -paperNoise) * u_texture.z * 0.075 * smoothstep(0.0, 0.45, alpha);
  spectral = clamp(spectral, 0.0, 1.0);

  if (u_include_background > 0.5) {
    vec3 outputColor = mix(u_background, spectral, alpha);
    outputColor += paperNoise * u_texture.z * 0.010;
    gl_FragColor = vec4(clamp(outputColor, 0.0, 1.0), 1.0);
  } else {
    gl_FragColor = vec4(spectral, alpha);
  }
}`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Prism Flow could not allocate a shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(`Prism Flow shader compilation failed: ${message}`);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Prism Flow could not allocate a WebGL program.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown program link error.";
    gl.deleteProgram(program);
    throw new Error(`Prism Flow WebGL link failed: ${message}`);
  }
  return program;
}

export class PrismFlowWebGLRenderer {
  private readonly buffer: WebGLBuffer;
  private readonly gl: WebGLRenderingContext;
  private readonly program: WebGLProgram;

  constructor(readonly canvas: HTMLCanvasElement | OffscreenCanvas) {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      stencil: false,
    }) as WebGLRenderingContext | null;
    if (!gl) throw new Error("Prism Flow requires WebGL support.");
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Prism Flow could not allocate a vertex buffer.");
    this.gl = gl;
    this.buffer = buffer;
    this.program = createProgram(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(this.program);
    const position = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }

  dispose(): void {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }

  draw(settings: PrismFlowSettings): void {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    const uniform2 = (name: string, x: number, y: number) => {
      const location = gl.getUniformLocation(this.program, name);
      if (location) gl.uniform2f(location, x, y);
    };
    const uniform3 = (name: string, values: readonly [number, number, number]) => {
      const location = gl.getUniformLocation(this.program, name);
      if (location) gl.uniform3f(location, values[0], values[1], values[2]);
    };
    const uniform4 = (name: string, a: number, b: number, c: number, d: number) => {
      const location = gl.getUniformLocation(this.program, name);
      if (location) gl.uniform4f(location, a, b, c, d);
    };
    uniform2("u_resolution", this.canvas.width, this.canvas.height);
    uniform2("u_focus", settings.focusX, 1 - settings.focusY);
    uniform4("u_shape", settings.opening, settings.curvature, settings.volume, settings.softness);
    uniform4("u_texture", settings.intensity, settings.bleed, settings.grain, 0);
    uniform4("u_motion", settings.drift, settings.breathing, settings.progress * settings.cycles, settings.cycles);
    uniform3("u_background", hexToRgb(settings.background));
    settings.colors.forEach((color, index) => uniform3(`u_c${index}`, hexToRgb(color)));
    const include = gl.getUniformLocation(this.program, "u_include_background");
    if (include) gl.uniform1f(include, settings.includeBackground ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

export function renderPrismFlowCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  settings: PrismFlowSettings,
): void {
  const renderer = new PrismFlowWebGLRenderer(canvas);
  try {
    renderer.draw(settings);
  } finally {
    renderer.dispose();
  }
}
