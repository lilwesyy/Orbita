"use client";

import { useState, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  IconSparkles,
  IconDeviceFloppy,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react";
import { AdFormatSelector } from "@/components/ad-format-selector";
import { AdPreview } from "@/components/ad-preview";
import { AdHistory } from "@/components/ad-history";
import { BrandSummary } from "@/components/brand-summary";
import { saveAdDesign, getAdDesign } from "@/actions/ad-designs";
import { getFormatById } from "@/lib/ad-formats";
import type { AdFormat, AdDesignSummary } from "@/types/ad-design";
import type { BrandProfile } from "@/types/brand-profile";

interface AdMakerWorkspaceProps {
  projectId: string;
  projectName: string;
  logoUrl: string | null;
  designs: AdDesignSummary[];
  hasApiKey: boolean;
  initialBrandProfile: BrandProfile | null;
}

const VARIANT_LABELS = ["Bold", "Minimal", "Dynamic"];

function stripFences(raw: string): string {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(
    /^```(?:html)?\s*\n?([\s\S]*?)```\s*$/
  );
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:html)?\s*\n?/, "")
      .replace(/```\s*$/, "")
      .trim();
  }
  return cleaned;
}

async function fetchVariant(
  format: AdFormat,
  prompt: string,
  projectId: string,
  variation: number
): Promise<string> {
  const res = await fetch("/api/ad-maker/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      format: format.id,
      formatLabel: format.label,
      width: format.width,
      height: format.height,
      prompt,
      projectId,
      variation,
    }),
  });

  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Generation failed");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
  }

  return stripFences(accumulated);
}

export function AdMakerWorkspace({
  projectId,
  projectName,
  logoUrl,
  designs,
  hasApiKey,
  initialBrandProfile,
}: AdMakerWorkspaceProps) {
  const [selectedFormat, setSelectedFormat] = useState<AdFormat | null>(null);
  const [prompt, setPrompt] = useState("");
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const brandProfile = initialBrandProfile;

  const handleGenerate = useCallback(async () => {
    if (!selectedFormat || !prompt.trim()) return;
    setIsGenerating(true);
    setVariants([]);
    setSelectedVariant(0);

    try {
      const results = await Promise.allSettled([
        fetchVariant(selectedFormat, prompt.trim(), projectId, 1),
        fetchVariant(selectedFormat, prompt.trim(), projectId, 2),
        fetchVariant(selectedFormat, prompt.trim(), projectId, 3),
      ]);

      const htmlResults: string[] = [];
      let hasError = false;

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          htmlResults.push(result.value);
        } else {
          hasError = true;
          const reason =
            result.status === "rejected"
              ? (result.reason as Error).message
              : "Empty response";
          htmlResults.push(`<div style="padding:20px;color:red;">Error: ${reason}</div>`);
        }
      }

      setVariants(htmlResults);

      if (hasError) {
        toast.error("Some variants failed to generate");
      }
    } catch {
      toast.error("Failed to connect to generation API");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedFormat, prompt, projectId]);

  const handleSave = useCallback(() => {
    if (!selectedFormat || !variants[selectedVariant]) return;
    startSaveTransition(async () => {
      const result = await saveAdDesign(projectId, {
        format: selectedFormat.id,
        prompt: prompt.trim(),
        sourceUrl: null,
        htmlContent: variants[selectedVariant],
        width: selectedFormat.width,
        height: selectedFormat.height,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Design saved");
      }
    });
  }, [selectedFormat, variants, selectedVariant, projectId, prompt]);

  const handleLoadDesign = useCallback(async (designId: string) => {
    const design = await getAdDesign(designId);
    if (!design) return;
    const format = getFormatById(design.format);
    if (format) setSelectedFormat(format);
    setPrompt(design.prompt);
    setVariants([design.htmlContent]);
    setSelectedVariant(0);
  }, []);

  if (!hasApiKey) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <IconSparkles className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">API Key Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure your Anthropic API key in Settings to use Ad Maker.
          </p>
          <Button asChild variant="outline">
            <a href="/settings">Go to Settings</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Brand Summary */}
      <BrandSummary
        projectId={projectId}
        logoUrl={logoUrl}
        brandProfile={brandProfile}
      />

      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Choose Format</CardTitle>
        </CardHeader>
        <CardContent>
          <AdFormatSelector
            selectedFormat={selectedFormat?.id ?? null}
            onSelect={setSelectedFormat}
          />
        </CardContent>
      </Card>

      {/* Prompt + Generate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Describe Your Ad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="E.g., Promotional post for summer sale, 30% off all services, modern and vibrant style..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!selectedFormat || !prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <IconLoader2 className="w-4 h-4 mr-1 animate-spin" />
                  Generating 3 variants...
                </>
              ) : (
                <>
                  <IconSparkles className="w-4 h-4 mr-1" />
                  Generate
                </>
              )}
            </Button>
            {variants.length > 0 && !isGenerating && (
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                <IconDeviceFloppy className="w-4 h-4 mr-1" />
                {isSaving ? "Saving..." : "Save Selected"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isGenerating && selectedFormat && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-medium">Generating 3 Variants</h3>
            <div
              className="flex items-center justify-center rounded-md border bg-muted/50 mx-auto"
              style={{
                width: "100%",
                height: 200,
              }}
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <IconLoader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">
                  Creating bold, minimal, and dynamic versions...
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variant Previews */}
      {!isGenerating && variants.length > 0 && selectedFormat && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                3. Pick Your Favorite
              </CardTitle>
              <div className="flex gap-2">
                {variants.map((_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={selectedVariant === i ? "default" : "outline"}
                    onClick={() => setSelectedVariant(i)}
                  >
                    {selectedVariant === i && (
                      <IconCheck className="w-3 h-3 mr-1" />
                    )}
                    {VARIANT_LABELS[i] ?? `Variant ${i + 1}`}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Thumbnails row */}
            {variants.length > 1 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {variants.map((html, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedVariant(i)}
                    className={`relative rounded-md border-2 overflow-hidden transition-all ${
                      selectedVariant === i
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <Badge
                      variant={
                        selectedVariant === i ? "default" : "secondary"
                      }
                      className="absolute top-1 left-1 z-10 text-[10px] px-1.5 py-0"
                    >
                      {VARIANT_LABELS[i]}
                    </Badge>
                    <div
                      className="bg-white"
                      style={{
                        width: "100%",
                        aspectRatio: `${selectedFormat.width}/${selectedFormat.height}`,
                        overflow: "hidden",
                      }}
                    >
                      <iframe
                        srcDoc={html}
                        sandbox=""
                        style={{
                          width: selectedFormat.width,
                          height: selectedFormat.height,
                          transform: `scale(${1 / (selectedFormat.width / 200)})`,
                          transformOrigin: "top left",
                          border: "none",
                          pointerEvents: "none",
                        }}
                        title={`Variant ${i + 1}`}
                        tabIndex={-1}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Full preview of selected */}
            <AdPreview
              htmlContent={variants[selectedVariant]}
              width={selectedFormat.width}
              height={selectedFormat.height}
              projectName={projectName}
              formatId={selectedFormat.id}
            />
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved Designs</CardTitle>
        </CardHeader>
        <CardContent>
          <AdHistory
            designs={designs}
            projectId={projectId}
            onLoad={handleLoadDesign}
          />
        </CardContent>
      </Card>
    </div>
  );
}
