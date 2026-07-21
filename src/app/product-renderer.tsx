"use client";

import * as React from "react";

import {
  getToolcraftTimelineLoopProgress,
  shouldIncludeToolcraftPreviewBackground,
} from "@/toolcraft/runtime";
import { useToolcraft } from "@/toolcraft/runtime/react";

import {
  getPrismFlowSettings,
  prismFlowSignature,
  PrismFlowWebGLRenderer,
} from "./prism-flow";

export function PrismFlowCanvas(): React.JSX.Element {
  const { state } = useToolcraft();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rendererRef = React.useRef<PrismFlowWebGLRenderer | null>(null);
  const frozenProgressRef = React.useRef(0);
  const [isInteracting, setIsInteracting] = React.useState(false);
  const timelineProgress = getToolcraftTimelineLoopProgress(state.timeline);

  if (!isInteracting) frozenProgressRef.current = timelineProgress;
  const renderedProgress = isInteracting ? frozenProgressRef.current : timelineProgress;
  const includeBackground = shouldIncludeToolcraftPreviewBackground({ state });
  const settings = getPrismFlowSettings(state, renderedProgress, includeBackground);
  const renderScale = Math.min(2, Math.max(1, Number(state.values["canvas.renderScale"] ?? 1)));
  const backingWidth = Math.max(1, Math.round(settings.width * renderScale));
  const backingHeight = Math.max(1, Math.round(settings.height * renderScale));
  const signature = prismFlowSignature(settings);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new PrismFlowWebGLRenderer(canvas);
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;
    if (canvas.width !== backingWidth) canvas.width = backingWidth;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;
    renderer.draw(settings);
  }, [backingHeight, backingWidth, signature]);

  React.useEffect(() => {
    const viewport = canvasRef.current?.closest<HTMLElement>(
      '[data-slot="toolcraft-runtime-canvas"]',
    );
    if (!viewport) return;
    const begin = () => setIsInteracting(true);
    const end = () => setIsInteracting(false);
    viewport.addEventListener("pointerdown", begin);
    viewport.addEventListener("pointercancel", end);
    viewport.addEventListener("pointerup", end);
    return () => {
      viewport.removeEventListener("pointerdown", begin);
      viewport.removeEventListener("pointercancel", end);
      viewport.removeEventListener("pointerup", end);
    };
  }, []);

  React.useEffect(() => {
    let timer: number | undefined;
    const isZoomButton = (event: PointerEvent) => {
      const target = event.target;
      return target instanceof Element && target.closest("button")?.getAttribute("aria-label")?.startsWith("Zoom ");
    };
    const begin = (event: PointerEvent) => {
      if (!isZoomButton(event)) return;
      window.clearTimeout(timer);
      setIsInteracting(true);
    };
    const end = (event: PointerEvent) => {
      if (!isZoomButton(event)) return;
      timer = window.setTimeout(() => setIsInteracting(false), 80);
    };
    document.addEventListener("pointerdown", begin, true);
    document.addEventListener("pointerup", end, true);
    return () => {
      document.removeEventListener("pointerdown", begin, true);
      document.removeEventListener("pointerup", end, true);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <canvas
      aria-label="Procedural prismatic light field"
      className="block size-full"
      data-prism-frame={renderedProgress.toFixed(4)}
      data-prism-signature={signature}
      data-testid="prism-flow-canvas"
      data-toolcraft-product-output="prism-flow"
      height={backingHeight}
      ref={canvasRef}
      role="img"
      style={{ height: "100%", width: "100%" }}
      width={backingWidth}
    />
  );
}
