import {
  createToolcraftPngExportCanvas,
  getToolcraftTimelineLoopProgress,
  getToolcraftVideoExportSize,
  shouldIncludeToolcraftExportBackground,
} from "@/toolcraft/runtime";
import type { ToolcraftState } from "@/toolcraft/runtime";

import {
  getPrismFlowSettings,
  PrismFlowWebGLRenderer,
  renderPrismFlowCanvas,
} from "./prism-flow";

export type PrismFlowImageExportResult = {
  blob: Blob;
  extension: "jpg" | "png";
  mimeType: "image/jpeg" | "image/png";
};

function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  mimeType: "image/jpeg" | "image/png",
  quality?: number,
): Promise<Blob> {
  if (typeof OffscreenCanvas === "function" && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ quality, type: mimeType });
  }
  const htmlCanvas = canvas as HTMLCanvasElement;
  return new Promise((resolve, reject) => {
    htmlCanvas.toBlob(
      (blob: Blob | null) => (blob ? resolve(blob) : reject(new Error("Prism Flow could not encode the image export."))),
      mimeType,
      quality,
    );
  });
}

export async function exportPrismFlowImage(
  state: ToolcraftState,
): Promise<PrismFlowImageExportResult> {
  const requestedFormat = String(state.values["export.image.format"] ?? "png").toLowerCase();
  const isJpg = requestedFormat === "jpg" || requestedFormat === "jpeg";
  const includeBackground =
    isJpg ||
    (shouldIncludeToolcraftExportBackground({ format: "png", schema: state.schema }) &&
      Boolean(state.values["export.includeBackground"] ?? true));
  const progress = getToolcraftTimelineLoopProgress(state.timeline);
  const settings = getPrismFlowSettings(state, progress, includeBackground);
  const sizingCanvas = createToolcraftPngExportCanvas({
    background: settings.background,
    includeBackground,
    render: () => undefined,
    resolution: state.values["export.image.resolution"] as string | undefined,
    state,
  });
  const canvas = typeof OffscreenCanvas === "function"
    ? new OffscreenCanvas(sizingCanvas.width, sizingCanvas.height)
    : document.createElement("canvas");
  canvas.width = sizingCanvas.width;
  canvas.height = sizingCanvas.height;
  renderPrismFlowCanvas(canvas, settings);
  const mimeType = isJpg ? "image/jpeg" : "image/png";
  const blob = await canvasToBlob(canvas, mimeType, isJpg ? 0.95 : undefined);
  return { blob, extension: isJpg ? "jpg" : "png", mimeType };
}

const preferredVideoMimeTypes: Record<string, readonly string[]> = {
  mp4: ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"],
  webm: ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"],
};

export function getPrismFlowVideoMimeType(format: string): string {
  const candidates = preferredVideoMimeTypes[format.toLowerCase()] ?? preferredVideoMimeTypes.webm!;
  for (const candidate of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return "video/webm";
}

export type PrismFlowVideoExportResult = {
  blob: Blob;
  height: number;
  mimeType: string;
  width: number;
};

type VideoTrackGenerator = MediaStreamTrack & { writable: WritableStream<VideoFrame> };
type VideoTrackGeneratorConstructor = new (options: { kind: "video" }) => VideoTrackGenerator;

export async function exportPrismFlowVideo(
  state: ToolcraftState,
  onProgress?: (progress: number) => void,
): Promise<PrismFlowVideoExportResult> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Prism Flow video export requires MediaRecorder support.");
  }
  const { height, width } = getToolcraftVideoExportSize({
    resolution: state.values["export.video.resolution"] as string | undefined,
    state,
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const renderer = new PrismFlowWebGLRenderer(canvas);
  const mimeType = getPrismFlowVideoMimeType(String(state.values["export.video.format"] ?? "mp4"));
  const durationSeconds = Math.max(0.1, state.timeline.durationSeconds);
  const framesPerSecond = 30;
  const totalFrames = Math.max(1, Math.round(durationSeconds * framesPerSecond));
  const frameDurationMs = 1000 / framesPerSecond;
  const Generator = (
    globalThis as typeof globalThis & { MediaStreamTrackGenerator?: VideoTrackGeneratorConstructor }
  ).MediaStreamTrackGenerator;
  const generatedTrack = typeof Generator === "function" && typeof VideoFrame !== "undefined"
    ? new Generator({ kind: "video" })
    : null;
  const stream = generatedTrack ? new MediaStream([generatedTrack]) : canvas.captureStream(0);
  const [videoTrack] = stream.getVideoTracks();
  const requestFrame = generatedTrack
    ? undefined
    : (videoTrack as MediaStreamTrack & { requestFrame?: () => void })?.requestFrame;
  if (!videoTrack || (!generatedTrack && typeof requestFrame !== "function")) {
    renderer.dispose();
    throw new Error("Prism Flow video export requires timestamped frames or canvas requestFrame support.");
  }

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  const recordingDone = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
    recorder.onerror = (event) => reject(event instanceof ErrorEvent ? event.error : new Error("Prism Flow video recorder failed."));
    recorder.onstop = () => chunks.length > 0
      ? resolve(new Blob(chunks, { type: mimeType }))
      : reject(new Error("Prism Flow video export produced no encoded data."));
  });

  recorder.start();
  await new Promise((resolve) => window.setTimeout(resolve, 100));
  let writer: WritableStreamDefaultWriter<VideoFrame> | null = null;
  try {
    if (generatedTrack) writer = generatedTrack.writable.getWriter();
    const startedAt = performance.now();
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
      renderer.draw(getPrismFlowSettings(state, frameIndex / totalFrames, true));
      if (writer) {
        const frame = new VideoFrame(canvas, {
          duration: Math.round(frameDurationMs * 1000),
          timestamp: Math.round(frameIndex * frameDurationMs * 1000),
        });
        try { await writer.write(frame); } finally { frame.close(); }
      } else {
        requestFrame!.call(videoTrack);
        const targetTime = startedAt + (frameIndex + 1) * frameDurationMs;
        const waitMs = targetTime - performance.now();
        if (waitMs > 0) await new Promise((resolve) => window.setTimeout(resolve, waitMs));
      }
      onProgress?.((frameIndex + 1) / totalFrames);
    }
  } finally {
    if (recorder.state !== "inactive") recorder.stop();
  }

  try {
    const blob = await recordingDone;
    await writer?.close().catch(() => undefined);
    videoTrack.stop();
    onProgress?.(1);
    return { blob, height, mimeType, width };
  } finally {
    renderer.dispose();
  }
}
