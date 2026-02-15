"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconSearch, IconRefresh, IconLoader2, IconExternalLink, IconSeo } from "@tabler/icons-react";
import { SeoScoreCard } from "@/components/seo-score-card";
import type { SeoAuditResult } from "@/types/seo-audit";

function getScoreColor(score: number) {
  if (score >= 80) return { bar: "bg-emerald-500", text: "text-emerald-500", ring: "ring-emerald-500/20" };
  if (score >= 50) return { bar: "bg-amber-500", text: "text-amber-500", ring: "ring-amber-500/20" };
  return { bar: "bg-red-500", text: "text-red-500", ring: "ring-red-500/20" };
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Needs Work";
  if (score >= 40) return "Poor";
  return "Critical";
}

interface SeoCheckerClientProps {
  projectId: string;
  projectName: string;
  initialResult: SeoAuditResult | null;
  defaultUrl: string;
}

export function SeoCheckerClient({
  projectId,
  projectName,
  initialResult,
  defaultUrl,
}: SeoCheckerClientProps) {
  const [url, setUrl] = useState(defaultUrl);
  const [result, setResult] = useState<SeoAuditResult | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/seo-audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to analyze URL");
        return;
      }

      setResult(data as SeoAuditResult);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const colors = result ? getScoreColor(result.overallScore) : null;

  // No result yet — show centered card with input
  if (!result && !loading) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center justify-items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <IconSeo className="h-7 w-7 text-foreground" />
          </div>
          <CardTitle>Analyze a Website</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Enter a URL to run a comprehensive SEO audit.
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                icon={<IconSearch className="size-4" />}
                onKeyDown={(e) => {
                  if (e.key === "Enter") analyze();
                }}
              />
            </div>
            <Button onClick={analyze}>
              <IconSearch className="size-4" />
              Analyze
            </Button>
          </div>
          {error && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">SEO Checker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyze SEO performance for {projectName}
        </p>
      </div>
      {/* URL Input — re-analyze bar */}
      <div className="flex gap-3">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          icon={<IconSearch className="size-4" />}
          onKeyDown={(e) => {
            if (e.key === "Enter") analyze();
          }}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={analyze} loading={loading}>
          <IconRefresh className="size-4" />
          Re-analyze
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <IconLoader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing {url}...</p>
        </div>
      )}

      {result && !loading && colors && (
        <>
          {/* Score + OG Preview row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Overall Score */}
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <div className="text-sm font-medium text-muted-foreground">SEO Score</div>
                <div className={`relative flex size-32 items-center justify-center rounded-full ring-8 ${colors.ring}`}>
                  <div className={`text-5xl font-bold ${colors.text}`}>
                    {result.overallScore}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Badge variant={result.overallScore >= 80 ? "success" : result.overallScore >= 50 ? "warning" : "destructive"}>
                    {getScoreLabel(result.overallScore)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">out of 100</span>
                </div>
                {/* Mini section breakdown */}
                <div className="mt-2 flex w-full flex-col gap-1.5">
                  {result.sections.map((s) => {
                    const pct = Math.round((s.score / s.maxScore) * 100);
                    const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
                    return (
                      <div key={s.name} className="flex items-center gap-2 text-xs">
                        <span className="w-20 shrink-0 truncate text-muted-foreground">{s.name}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">{s.score}/{s.maxScore}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* OG Preview - social card mockup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Social Share Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border bg-background">
                  {/* OG Image thumbnail */}
                  {result.rawData.ogImage ? (
                    <div className="relative aspect-[1.91/1] max-h-72 w-full overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={result.rawData.ogImage}
                        alt="OG Image preview"
                        className="absolute inset-0 size-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center bg-muted">
                      <span className="text-xs text-muted-foreground">No og:image found</span>
                    </div>
                  )}
                  {/* Card body like social platforms show */}
                  <div className="flex flex-col gap-1 border-t p-3">
                    <span className="text-xs uppercase text-muted-foreground">
                      {(() => {
                        try { return new URL(result.url).hostname; } catch { return result.url; }
                      })()}
                    </span>
                    <span className="line-clamp-1 text-sm font-semibold">
                      {result.rawData.ogTitle || result.rawData.title || "No title"}
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {result.rawData.ogDescription || result.rawData.metaDescription || "No description"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <IconExternalLink className="size-3" />
                  <span className="truncate">{result.rawData.ogImage || "No og:image set"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {result.sections.map((section) => (
              <SeoScoreCard key={section.name} section={section} />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
            <span>
              Analyzed on{" "}
              {new Date(result.analyzedAt).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              {result.url}
              <IconExternalLink className="size-3" />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
