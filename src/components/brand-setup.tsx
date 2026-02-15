"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconPalette,
  IconLoader2,
  IconRefresh,
  IconEdit,
  IconCheck,
  IconWorldWww,
} from "@tabler/icons-react";
import { ProjectLogoUpload } from "@/components/project-logo-upload";
import type { BrandProfile } from "@/types/brand-profile";

interface BrandSetupProps {
  projectId: string;
  projectName: string;
  logoUrl: string | null;
  brandProfile: BrandProfile | null;
  onProfileChange: (profile: BrandProfile) => void;
}

export function BrandSetup({
  projectId,
  projectName,
  logoUrl,
  brandProfile,
  onProfileChange,
}: BrandSetupProps) {
  const [url, setUrl] = useState(brandProfile?.sourceUrl ?? "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<BrandProfile | null>(
    brandProfile
  );

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/ad-maker/analyze-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), projectId }),
      });

      const data = (await res.json()) as {
        brandProfile?: BrandProfile;
        error?: string;
      };

      if (!res.ok) {
        toast.error(data.error ?? "Analysis failed");
        return;
      }

      if (data.brandProfile) {
        onProfileChange(data.brandProfile);
        setEditedProfile(data.brandProfile);
        setIsEditing(false);
        toast.success("Brand profile analyzed successfully");
      }
    } catch {
      toast.error("Failed to connect to analysis API");
    } finally {
      setIsAnalyzing(false);
    }
  }, [url, projectId, onProfileChange]);

  const handleColorChange = (index: number, newColor: string) => {
    if (!editedProfile) return;
    const updated = {
      ...editedProfile,
      colors: editedProfile.colors.map((c, i) => (i === index ? newColor : c)),
    };
    setEditedProfile(updated);
  };

  const handleSaveEdits = useCallback(async () => {
    if (!editedProfile) return;
    setIsEditing(false);
    onProfileChange(editedProfile);

    try {
      await fetch("/api/ad-maker/analyze-brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, brandProfile: editedProfile }),
      });
      toast.success("Brand profile updated");
    } catch {
      toast.error("Failed to save changes");
    }
  }, [editedProfile, projectId, onProfileChange]);

  // No brand profile yet — show setup card
  if (!brandProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconPalette className="w-5 h-5" />
            Configure Your Brand
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload your logo and enter your website URL to let the AI analyze
            your brand colors, fonts, style, and tone.
          </p>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Logo
            </Label>
            <ProjectLogoUpload
              projectId={projectId}
              projectName={projectName}
              logoUrl={logoUrl}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-url">Website URL</Label>
            <div className="flex gap-2">
              <Input
                id="brand-url"
                type="url"
                placeholder="https://yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAnalyzing}
              />
              <Button
                onClick={handleAnalyze}
                disabled={!url.trim() || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <IconLoader2 className="w-4 h-4 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <IconWorldWww className="w-4 h-4 mr-1" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Brand profile exists — show summary
  const profile = isEditing ? editedProfile! : brandProfile;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconPalette className="w-5 h-5" />
            Brand Profile
          </CardTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <Button size="sm" variant="outline" onClick={handleSaveEdits}>
                <IconCheck className="w-4 h-4 mr-1" />
                Save
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditedProfile(brandProfile);
                  setIsEditing(true);
                }}
              >
                <IconEdit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <IconLoader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <IconRefresh className="w-4 h-4 mr-1" />
              )}
              Re-analyze
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source URL for re-analyze */}
        {(isEditing || isAnalyzing) && (
          <div className="space-y-2">
            <Label htmlFor="brand-url-edit">Website URL</Label>
            <Input
              id="brand-url-edit"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
        )}

        {/* Colors */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Colors
          </Label>
          <div className="flex flex-wrap gap-2">
            {profile.colors.map((color, i) => (
              <div key={i} className="flex items-center gap-1">
                {isEditing ? (
                  <label className="cursor-pointer relative">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(i, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="w-8 h-8 rounded-full border-2 border-border ring-2 ring-primary/20"
                      style={{ backgroundColor: color }}
                    />
                  </label>
                ) : (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                )}
                <span className="text-xs text-muted-foreground font-mono">
                  {color}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Fonts
          </Label>
          <div className="flex flex-wrap gap-1">
            {profile.fonts.map((font) => (
              <Badge key={font} variant="secondary">
                {font}
              </Badge>
            ))}
          </div>
        </div>

        {/* Style & Tone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Style
            </Label>
            {isEditing ? (
              <Input
                value={editedProfile?.style ?? ""}
                onChange={(e) =>
                  setEditedProfile((p) =>
                    p ? { ...p, style: e.target.value } : p
                  )
                }
              />
            ) : (
              <p className="text-sm">{profile.style}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Tone
            </Label>
            {isEditing ? (
              <Input
                value={editedProfile?.tone ?? ""}
                onChange={(e) =>
                  setEditedProfile((p) =>
                    p ? { ...p, tone: e.target.value } : p
                  )
                }
              />
            ) : (
              <p className="text-sm">{profile.tone}</p>
            )}
          </div>
        </div>

        {/* Industry & Logo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Industry
            </Label>
            <p className="text-sm">{profile.industry}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Logo
            </Label>
            <ProjectLogoUpload
              projectId={projectId}
              projectName={projectName}
              logoUrl={logoUrl}
            />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Source: {profile.sourceUrl} — Analyzed{" "}
          {new Date(profile.analyzedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
