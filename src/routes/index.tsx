import { ToolcraftApp } from "@/toolcraft/runtime/react";

import { appSchema } from "../app/app-schema";
import {
  exportPrismFlowImage,
  exportPrismFlowVideo,
} from "../app/export";
import { PrismFlowCanvas } from "../app/product-renderer";

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function AppHome(): React.JSX.Element {
  return (
    <ToolcraftApp
      canvasContent={<PrismFlowCanvas />}
      className="h-dvh min-h-dvh"
      onPanelAction={async ({ action, reportProgress, state }) => {
        const value = typeof action === "string" ? action : action.value;

        if (value === "export.png") {
          reportProgress(0.1);
          const { blob, extension } = await exportPrismFlowImage(state);
          reportProgress(0.7);
          downloadBlob(blob, `prism-flow.${extension}`);
          reportProgress(1);
          return;
        }

        if (value === "export.video") {
          const { blob, mimeType } = await exportPrismFlowVideo(
            state,
            reportProgress,
          );
          const extension = mimeType.includes("mp4") ? "mp4" : "webm";
          downloadBlob(blob, `prism-flow.${extension}`);
        }
      }}
      renderDefaultCanvasMedia={false}
      schema={appSchema}
    />
  );
}
