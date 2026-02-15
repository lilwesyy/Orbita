"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconPalette, IconExternalLink } from "@tabler/icons-react";
import type { BrandProfile } from "@/types/brand-profile";

interface BrandSummaryProps {
  projectId: string;
  logoUrl: string | null;
  brandProfile: BrandProfile | null;
}

export function BrandSummary({
  projectId,
  logoUrl,
  brandProfile,
}: BrandSummaryProps) {
  const horizontalUrl =
    brandProfile?.logos?.find((l) => l.variant === "horizontal")?.url ?? null;

  if (!brandProfile?.analyzedAt && !logoUrl) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <IconPalette className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No brand profile configured yet.
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/projects/${projectId}/branding`}>
              Set up branding
              <IconExternalLink className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconPalette className="w-5 h-5" />
            Brand Profile
          </CardTitle>
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/projects/${projectId}/branding`}>
              Edit
              <IconExternalLink className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-4">
          {(logoUrl || horizontalUrl) && (
            <div className="flex shrink-0 gap-2">
              {logoUrl && (
                <div className="rounded-lg border bg-muted/50 p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Square logo"
                    className="w-12 h-12 object-contain"
                  />
                </div>
              )}
              {horizontalUrl && (
                <div className="rounded-lg border bg-muted/50 p-1.5 flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={horizontalUrl}
                    alt="Horizontal logo"
                    className="h-12 max-w-[120px] object-contain"
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex-1 space-y-2 min-w-0">
            {brandProfile?.colors && brandProfile.colors.length > 0 && (
              <div className="flex items-center gap-2">
                {brandProfile.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {brandProfile?.fonts?.map((font) => (
                <Badge key={font} variant="secondary" className="text-xs">
                  {font}
                </Badge>
              ))}
              {brandProfile?.style && (
                <Badge variant="outline" className="text-xs">
                  {brandProfile.style}
                </Badge>
              )}
              {brandProfile?.industry && (
                <Badge variant="outline" className="text-xs">
                  {brandProfile.industry}
                </Badge>
              )}
            </div>
            {brandProfile?.tone && (
              <p className="text-xs text-muted-foreground">{brandProfile.tone}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
