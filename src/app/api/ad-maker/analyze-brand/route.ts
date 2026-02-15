import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { readFile } from "fs/promises";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { BrandProfile } from "@/types/brand-profile";
import type { ImageBlockParam, TextBlockParam } from "@anthropic-ai/sdk/resources/messages";

interface AnalyzeBrandRequestBody {
  url: string;
  projectId: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AnalyzeBrandRequestBody;
  const { url, projectId } = body;

  if (!url || !projectId) {
    return NextResponse.json(
      { error: "Missing required fields: url and projectId" },
      { status: 400 }
    );
  }

  // Normalize URL: add https:// if no protocol
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  // Verify project exists and get logo
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, logoUrl: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Read logo file if available — will be sent to Claude for color extraction
  type ImageMediaType = "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  let logoBase64: string | null = null;
  let logoMediaType: ImageMediaType = "image/png";
  if (project.logoUrl) {
    try {
      const logoPath = join(process.cwd(), "public", project.logoUrl);
      const logoBuffer = await readFile(logoPath);
      logoBase64 = logoBuffer.toString("base64");
      const ext = project.logoUrl.split(".").pop()?.toLowerCase() ?? "png";
      const mimeMap: Record<string, ImageMediaType> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
        gif: "image/gif",
      };
      logoMediaType = mimeMap[ext] ?? "image/png";
    } catch {
      // Logo file not found — skip
    }
  }

  // Get and decrypt API key
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings?.anthropicApiKey) {
    return NextResponse.json(
      { error: "Anthropic API key not configured." },
      { status: 400 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(settings.anthropicApiKey);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt API key." },
      { status: 500 }
    );
  }

  // Fetch website content
  let htmlContent: string;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,it;q=0.8",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Website returned ${res.status} ${res.statusText}` },
        { status: 400 }
      );
    }

    htmlContent = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Could not reach the website: ${msg}` },
      { status: 400 }
    );
  }

  // Extract useful parts from HTML
  const metaTags = (htmlContent.match(/<meta[^>]+>/gi) ?? []).join("\n");

  // Inline <style> tags
  const inlineStyles = (
    htmlContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? []
  )
    .join("\n")
    .slice(0, 5000);

  // Fetch external CSS stylesheets linked in the HTML
  const linkMatches = htmlContent.matchAll(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi
  );
  const linkMatches2 = htmlContent.matchAll(
    /<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi
  );
  const cssUrls = new Set<string>();
  for (const m of [...linkMatches, ...linkMatches2]) {
    try {
      const cssUrl = new URL(m[1], normalizedUrl).href;
      cssUrls.add(cssUrl);
    } catch {
      // invalid URL — skip
    }
  }

  let externalCss = "";
  const fetchHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  };

  // Fetch up to 5 external stylesheets in parallel
  const cssPromises = [...cssUrls].slice(0, 5).map(async (cssUrl) => {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 8000);
      const r = await fetch(cssUrl, {
        signal: controller.signal,
        headers: fetchHeaders,
      });
      clearTimeout(tid);
      if (r.ok) return (await r.text()).slice(0, 10000);
    } catch {
      // skip unreachable stylesheets
    }
    return "";
  });
  const cssResults = await Promise.all(cssPromises);
  externalCss = cssResults.join("\n").slice(0, 15000);

  const allCss = `${inlineStyles}\n${externalCss}`;

  // Extract CSS custom properties (--var-name: value)
  const cssVarMatches = allCss.matchAll(
    /--([\w-]+)\s*:\s*([^;}{]+)/g
  );
  const cssVariables: string[] = [];
  for (const m of cssVarMatches) {
    const value = m[2].trim();
    // Only keep color-like variables
    if (
      /^#[0-9a-fA-F]/.test(value) ||
      /^(?:rgb|hsl)a?\(/.test(value) ||
      /(?:color|bg|background|primary|secondary|accent|brand)/i.test(m[1])
    ) {
      cssVariables.push(`--${m[1]}: ${value}`);
    }
  }

  // Extract theme-color from meta tags
  const themeColorMatch = metaTags.match(
    /name=["']theme-color["'][^>]+content=["']([^"']+)["']/i
  );
  const themeColor = themeColorMatch?.[1] ?? "";

  // Extract colors from inline style attributes in HTML (actually used on elements)
  const inlineStyleColors: string[] = [];
  const styleAttrMatches = htmlContent.matchAll(/style=["']([^"']+)["']/gi);
  for (const m of styleAttrMatches) {
    const hexInStyle = m[1].match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    const rgbInStyle =
      m[1].match(
        /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g
      ) ?? [];
    inlineStyleColors.push(...hexInStyle, ...rgbInStyle);
  }

  // Extract colors from CSS property values (background-color, color, border-color, fill, stroke)
  // This captures colors actually applied to elements, not just class definitions
  const cssPropertyColors: string[] = [];
  const cssPropMatches = allCss.matchAll(
    /(?:background-color|(?<!-)color|border-color|fill|stroke|background)\s*:\s*([^;}{]+)/gi
  );
  for (const m of cssPropMatches) {
    const val = m[1].trim();
    const hexInProp = val.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    const rgbInProp =
      val.match(
        /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g
      ) ?? [];
    cssPropertyColors.push(...hexInProp, ...rgbInProp);
  }

  // Extract Tailwind CSS classes actually used in HTML (class="bg-blue-500 text-green-600")
  const tailwindColors: string[] = [];
  const classMatches = htmlContent.matchAll(/class=["']([^"']+)["']/gi);
  for (const m of classMatches) {
    const colorClasses =
      m[1].match(
        /(?:bg|text|border|ring|from|to|via)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}/g
      ) ?? [];
    tailwindColors.push(...colorClasses);
  }

  // Count Tailwind color families by usage
  const twFamilyCount = new Map<string, number>();
  for (const cls of tailwindColors) {
    const familyMatch = cls.match(
      /(?:bg|text|border|ring|from|to|via)-([\w]+)-\d+/
    );
    if (familyMatch) {
      const family = familyMatch[1];
      twFamilyCount.set(family, (twFamilyCount.get(family) ?? 0) + 1);
    }
  }
  const twColorUsage = [...twFamilyCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([family, count]) => `${family} (×${count})`)
    .join(", ");

  // Extract font-family declarations
  const fontMatches = allCss.matchAll(
    /font-family\s*:\s*([^;}{]+)/gi
  );
  const fontFamilies: string[] = [];
  for (const m of fontMatches) {
    fontFamilies.push(m[1].trim());
  }

  const textContent = htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  const websiteData = `
META TAGS:
${metaTags.slice(0, 2000)}
${themeColor ? `\nTHEME COLOR (from meta tag): ${themeColor}` : ""}

CSS CUSTOM PROPERTIES / THEME VARIABLES (highest priority):
${cssVariables.slice(0, 40).join("\n")}

COLORS FROM INLINE style="" ATTRIBUTES ON HTML ELEMENTS:
${[...new Set(inlineStyleColors)].slice(0, 30).join(", ")}

COLORS FROM CSS PROPERTY VALUES (background-color, color, border-color, fill):
${[...new Set(cssPropertyColors)].slice(0, 30).join(", ")}

TAILWIND COLOR CLASSES USED IN HTML (by family, most used first):
${twColorUsage || "None detected"}

FONT-FAMILY DECLARATIONS:
${[...new Set(fontFamilies)].slice(0, 10).join("\n")}

PAGE TEXT CONTENT:
${textContent}
`.trim();

  // Call Claude to analyze
  const client = new Anthropic({ apiKey });

  const systemPrompt = `Analyze this website content and extract brand information. Return ONLY valid JSON with no extra text:
{
  "colors": ["#hex1", "#hex2", ...],
  "fonts": ["Font1", "Font2"],
  "style": "description of visual style",
  "tone": "description of brand voice/tone",
  "logoDescription": "description of logo if identifiable",
  "industry": "business sector/industry"
}

IMPORTANT — how to determine the real brand colors (priority order):
1. LOGO IMAGE: If a logo image is attached, extract the dominant colors directly from it. The logo is the most authoritative source of brand colors.
2. THEME COLOR meta tag = a reliable brand color signal.
3. CSS CUSTOM PROPERTIES: --primary, --accent, --brand-* = theme colors chosen by the developer.
4. TAILWIND COLOR CLASSES USED IN HTML: Shows which color families are actually applied to elements. Map to standard hex (e.g. blue-600=#2563eb, green-500=#22c55e).
5. INLINE STYLE COLORS and CSS PROPERTY COLORS.

Rules:
- colors: Return 3-6 brand colors as HEX (#rrggbb). Prioritize colors from the logo image above all else. NEVER return neutrals (#000, #fff, grays) unless the brand is truly monochrome. Only distinctive brand colors.
- fonts: List actual font families from CSS. Never say "system default".
- style: Visual style in 5-15 words.
- tone: Brand voice/tone in 5-15 words.
- logoDescription: Brief logo description based on the attached image or HTML clues.
- industry: Business sector.`;

  try {
    // Build message content: logo image (if available) + website data text
    const userContent: (ImageBlockParam | TextBlockParam)[] = [];

    if (logoBase64) {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: logoMediaType,
          data: logoBase64,
        },
      });
      userContent.push({
        type: "text",
        text: "Above is the project LOGO. Extract the dominant colors from it.\n\n",
      });
    }

    userContent.push({
      type: "text",
      text: `Analyze this website (${normalizedUrl}):\n\n${websiteData}`,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse JSON from response (handle potential markdown fences)
    let jsonStr = textBlock.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const analysisResult = JSON.parse(jsonStr) as {
      colors: string[];
      fonts: string[];
      style: string;
      tone: string;
      logoDescription: string;
      industry: string;
    };

    const brandProfile: BrandProfile = {
      sourceUrl: normalizedUrl,
      colors: analysisResult.colors,
      fonts: analysisResult.fonts,
      style: analysisResult.style,
      tone: analysisResult.tone,
      logoDescription: analysisResult.logoDescription,
      industry: analysisResult.industry,
      analyzedAt: new Date().toISOString(),
    };

    // Save to project
    await prisma.project.update({
      where: { id: projectId },
      data: { brandProfile: JSON.stringify(brandProfile) },
    });

    return NextResponse.json({ brandProfile });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to analyze brand";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: manually update brand profile
interface UpdateBrandRequestBody {
  projectId: string;
  brandProfile: BrandProfile;
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as UpdateBrandRequestBody;
  const { projectId, brandProfile } = body;

  if (!projectId || !brandProfile) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { brandProfile: JSON.stringify(brandProfile) },
  });

  return NextResponse.json({ brandProfile });
}
