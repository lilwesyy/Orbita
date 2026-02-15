"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AD_FORMATS } from "@/lib/ad-formats";
import type { AdFormat } from "@/types/ad-design";
import { cn } from "@/lib/utils";

interface AdFormatSelectorProps {
  selectedFormat: string | null;
  onSelect: (format: AdFormat) => void;
}

export function AdFormatSelector({ selectedFormat, onSelect }: AdFormatSelectorProps) {
  const socialFormats = AD_FORMATS.filter((f) => f.category === "social");
  const printFormats = AD_FORMATS.filter((f) => f.category === "print");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Social Media</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {socialFormats.map((format) => (
            <FormatCard
              key={format.id}
              format={format}
              isSelected={selectedFormat === format.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Print</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {printFormats.map((format) => (
            <FormatCard
              key={format.id}
              format={format}
              isSelected={selectedFormat === format.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FormatCard({
  format,
  isSelected,
  onSelect,
}: {
  format: AdFormat;
  isSelected: boolean;
  onSelect: (format: AdFormat) => void;
}) {
  // Mini aspect-ratio preview
  const maxH = 40;
  const scale = maxH / format.height;
  const previewW = Math.round(format.width * scale);
  const previewH = maxH;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:border-primary/50",
        isSelected && "border-primary bg-primary/5"
      )}
      onClick={() => onSelect(format)}
    >
      <CardContent className="p-3 flex flex-col items-center gap-2">
        <div
          className="border border-muted-foreground/30 rounded-sm bg-muted/50"
          style={{ width: previewW, height: previewH }}
        />
        <div className="text-center">
          <p className="text-xs font-medium leading-tight">{format.label}</p>
          <p className="text-[10px] text-muted-foreground">
            {format.width}×{format.height}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
