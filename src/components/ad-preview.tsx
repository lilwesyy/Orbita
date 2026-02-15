"use client";

import { useRef, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconDownload, IconLoader2 } from "@tabler/icons-react";

interface AdPreviewProps {
  htmlContent: string;
  width: number;
  height: number;
  projectName: string;
  formatId: string;
}

export function AdPreview({
  htmlContent,
  width,
  height,
  projectName,
  formatId,
}: AdPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Scale iframe to fit container
  const maxContainerWidth = 600;
  const scale = Math.min(1, maxContainerWidth / width);

  const handleExportPng = useCallback(async () => {
    setIsExporting(true);
    try {
      // Use SVG foreignObject to render HTML to canvas
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${htmlContent}
            </div>
          </foreignObject>
        </svg>`;

      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.width = width;
      img.height = height;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to render"));
        img.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);

      const link = document.createElement("a");
      const timestamp = Date.now();
      const safeName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      link.download = `${safeName}-${formatId}-${timestamp}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Fallback: try html2canvas on iframe content
      try {
        const iframe = iframeRef.current;
        if (!iframe?.contentDocument?.body) return;

        const { default: html2canvas } = await import("html2canvas-pro");
        const root = iframe.contentDocument.body
          .firstElementChild as HTMLElement;
        if (!root) return;

        const canvas = await html2canvas(root, {
          width,
          height,
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const link = document.createElement("a");
        const timestamp = Date.now();
        const safeName = projectName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        link.download = `${safeName}-${formatId}-${timestamp}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch {
        // Last resort: open print dialog
        const iframe = iframeRef.current;
        iframe?.contentWindow?.print();
      }
    } finally {
      setIsExporting(false);
    }
  }, [htmlContent, width, height, projectName, formatId]);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Preview</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPng}
            disabled={isExporting}
          >
            {isExporting ? (
              <IconLoader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <IconDownload className="w-4 h-4 mr-1" />
            )}
            {isExporting ? "Exporting..." : "Export PNG"}
          </Button>
        </div>
        <div
          className="relative overflow-hidden rounded-md border bg-white mx-auto"
          style={{
            width: width * scale,
            height: height * scale,
          }}
        >
          <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            srcDoc={htmlContent}
            style={{
              width,
              height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              border: "none",
            }}
            title="Ad Preview"
          />
        </div>
      </CardContent>
    </Card>
  );
}
