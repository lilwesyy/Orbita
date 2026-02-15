import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import { join } from "path";
import type { BrandProfile } from "@/types/brand-profile";

interface GenerateRequestBody {
  format: string;
  formatLabel: string;
  width: number;
  height: number;
  prompt: string;
  projectId?: string;
  variation?: number; // 1, 2, or 3
}

const variationStyles = [
  "Use a BOLD and HIGH-CONTRAST approach with strong geometric shapes, large typography, and vibrant solid colors.",
  "Use an ELEGANT and MINIMAL approach with plenty of whitespace, subtle gradients, thin lines, and refined typography.",
  "Use a DYNAMIC and CREATIVE approach with diagonal elements, overlapping shapes, playful composition, and energetic layout.",
];

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GenerateRequestBody;
  const { format, formatLabel, width, height, prompt, projectId, variation } = body;

  if (!format || !width || !height || !prompt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get and decrypt API key
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings?.anthropicApiKey) {
    return NextResponse.json(
      { error: "Anthropic API key not configured. Go to Settings to add it." },
      { status: 400 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(settings.anthropicApiKey);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt API key. Please re-enter it in Settings." },
      { status: 500 }
    );
  }

  // Load brand profile from project if available
  let brandGuidelines = "";

  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { brandProfile: true, logoUrl: true },
    });

    if (project?.brandProfile) {
      const bp = JSON.parse(project.brandProfile) as BrandProfile;
      brandGuidelines = `

BRAND GUIDELINES:
- Primary colors: ${bp.colors?.join(", ") ?? "not specified"}
- Use these colors as the dominant palette. You may use tints/shades of these.
- Fonts: ${bp.fonts?.join(", ") ?? "not specified"} (use CSS font-family fallbacks since no external fonts allowed)
- Brand style: ${bp.style ?? "not specified"}
- Brand tone: ${bp.tone ?? "not specified"}
- Logo: ${bp.logoDescription ?? "not specified"}
- Industry: ${bp.industry ?? "not specified"}`;

      // Load logo files and convert to base64 data URIs
      const squareLogoUrl = project.logoUrl;
      const horizontalLogoUrl = bp.logos?.find((l) => l.variant === "horizontal")?.url;

      const logoEntries: { label: string; url: string }[] = [];
      if (squareLogoUrl) logoEntries.push({ label: "square icon logo", url: squareLogoUrl });
      if (horizontalLogoUrl) logoEntries.push({ label: "horizontal full wordmark logo", url: horizontalLogoUrl });

      for (const entry of logoEntries) {
        try {
          const logoPath = join(process.cwd(), "public", entry.url);
          const logoBuffer = await readFile(logoPath);
          const ext = entry.url.split(".").pop()?.toLowerCase() ?? "png";
          const mimeMap: Record<string, string> = {
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            webp: "image/webp",
            svg: "image/svg+xml",
            gif: "image/gif",
          };
          const mime = mimeMap[ext] ?? "image/png";
          const dataUri = `data:${mime};base64,${logoBuffer.toString("base64")}`;
          brandGuidelines += `\n- Available logo (${entry.label}): <img> data URI: ${dataUri}`;
        } catch {
          // Logo file not found — skip
        }
      }

      if (logoEntries.length > 0) {
        brandGuidelines += `\n- Choose the most appropriate logo for this ad format: use the horizontal wordmark when there is enough width, or the square icon for compact/small formats. Embed it using an <img> tag.`;
      }
    }
  }

  const systemPrompt = `You are an expert graphic designer. Create a marketing visual as a single self-contained HTML document.

REQUIREMENTS:
- Output ONLY valid HTML. No markdown, no code fences, no explanations.
- The root element must be a <div> exactly ${width}px × ${height}px with overflow:hidden.
- All CSS must be inline or in a <style> tag. NO external resources, fonts, or images.
- Use CSS gradients, geometric shapes, and inline SVG for visual elements.
- Create a professional design with clear visual hierarchy, good contrast, and balanced whitespace.
- Use a cohesive color palette that feels modern and polished.
- Text should be legible and well-sized for the format.

FORMAT: ${formatLabel} (${width}×${height}px)${brandGuidelines}${variation && variation >= 1 && variation <= 3 ? `\n\nDESIGN DIRECTION:\n${variationStyles[variation - 1]}` : ""}`;

  const client = new Anthropic({ apiKey });

  const stream = client.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`\n<!-- ERROR: ${message} -->`));
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
