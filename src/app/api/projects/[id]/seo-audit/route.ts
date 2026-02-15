import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  SeoAuditResult,
  SeoRawData,
  SeoSection,
  SeoCheck,
  SeoStatus,
} from "@/types/seo-audit";

function extractMeta(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`,
    "i"
  );
  const m = html.match(re);
  return m ? (m[1] ?? m[2] ?? null) : null;
}

function extractAttr(html: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]+${attr}=["']([^"']*)["']`, "i");
  const m = html.match(re);
  return m?.[1] ?? null;
}

function parseRawData(html: string, url: string): SeoRawData {
  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Meta description
  const metaDescription = extractMeta(html, "description");

  // Canonical
  const canonicalMatch = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i
  );
  const canonical = canonicalMatch?.[1] ?? null;

  // Robots
  const robots = extractMeta(html, "robots");

  // OG tags
  const ogTitle = extractMeta(html, "og:title");
  const ogDescription = extractMeta(html, "og:description");
  const ogImage = extractMeta(html, "og:image");
  const ogUrl = extractMeta(html, "og:url");

  // Twitter tags
  const twitterCard = extractMeta(html, "twitter:card");
  const twitterTitle = extractMeta(html, "twitter:title");
  const twitterDescription = extractMeta(html, "twitter:description");

  // Headings
  const headings: { tag: string; text: string }[] = [];
  const headingRe = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
  let hm;
  while ((hm = headingRe.exec(html)) !== null) {
    headings.push({
      tag: hm[1].toUpperCase(),
      text: hm[2].replace(/<[^>]*>/g, "").trim(),
    });
  }

  // Images
  const images: { src: string; alt: string | null }[] = [];
  const imgRe = /<img[^>]*>/gi;
  let im;
  while ((im = imgRe.exec(html)) !== null) {
    const tag = im[0];
    const srcMatch = tag.match(/src=["']([^"']*)["']/i);
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    if (srcMatch) {
      images.push({
        src: srcMatch[1],
        alt: altMatch ? altMatch[1] : null,
      });
    }
  }

  // Links
  const links: { href: string; isExternal: boolean }[] = [];
  const linkRe = /<a[^>]+href=["']([^"']*)["'][^>]*>/gi;
  let lm;
  const baseHost = new URL(url).hostname;
  while ((lm = linkRe.exec(html)) !== null) {
    const href = lm[1];
    let isExternal = false;
    try {
      const linkUrl = new URL(href, url);
      isExternal = linkUrl.hostname !== baseHost;
    } catch {
      // relative or invalid
    }
    links.push({ href, isExternal });
  }

  // Viewport
  const viewport = extractAttr(html, "meta", "name")?.toLowerCase() === "viewport"
    ? extractAttr(html, "meta[name=\"viewport\"]", "content")
    : null;
  const viewportMatch = html.match(
    /<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i
  );
  const viewportValue = viewportMatch?.[1] ?? null;

  // Charset
  const charsetMatch = html.match(
    /<meta[^>]+charset=["']([^"']*)["']/i
  );
  const charset = charsetMatch?.[1] ?? null;

  // Lang
  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  const lang = langMatch?.[1] ?? null;

  // Inline styles count
  const inlineStyleCount = (html.match(/style=["']/gi) || []).length;

  // Script count
  const scriptCount = (html.match(/<script/gi) || []).length;

  return {
    title,
    metaDescription,
    canonical,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    twitterCard,
    twitterTitle,
    twitterDescription,
    headings,
    images,
    links,
    viewport: viewportValue,
    charset,
    lang,
    inlineStyleCount,
    scriptCount,
  };
}

function check(
  label: string,
  maxPoints: number,
  value: string,
  status: SeoStatus,
  recommendation: string
): SeoCheck {
  const points = status === "pass" ? maxPoints : status === "warning" ? Math.round(maxPoints * 0.5) : 0;
  return { label, status, value, recommendation, points, maxPoints };
}

function analyzeMetaTags(raw: SeoRawData): SeoSection {
  const checks: SeoCheck[] = [];

  // Title exists (8pt)
  checks.push(
    raw.title
      ? check("Title tag", 8, raw.title, "pass", "")
      : check("Title tag", 8, "Missing", "fail", "Add a <title> tag to your page")
  );

  // Title length (4pt)
  if (raw.title) {
    const len = raw.title.length;
    checks.push(
      len >= 30 && len <= 60
        ? check("Title length", 4, `${len} chars`, "pass", "")
        : len > 0
          ? check("Title length", 4, `${len} chars`, "warning", "Keep title between 30-60 characters")
          : check("Title length", 4, "Empty", "fail", "Add meaningful text to your title")
    );
  } else {
    checks.push(check("Title length", 4, "N/A", "fail", "Add a title tag first"));
  }

  // Description exists (8pt)
  checks.push(
    raw.metaDescription
      ? check("Meta description", 8, raw.metaDescription.slice(0, 80) + (raw.metaDescription.length > 80 ? "..." : ""), "pass", "")
      : check("Meta description", 8, "Missing", "fail", "Add a meta description tag")
  );

  // Description length (3pt)
  if (raw.metaDescription) {
    const len = raw.metaDescription.length;
    checks.push(
      len >= 120 && len <= 160
        ? check("Description length", 3, `${len} chars`, "pass", "")
        : len > 0
          ? check("Description length", 3, `${len} chars`, "warning", "Keep description between 120-160 characters")
          : check("Description length", 3, "Empty", "fail", "Add meaningful text to your description")
    );
  } else {
    checks.push(check("Description length", 3, "N/A", "fail", "Add a meta description first"));
  }

  // Canonical (2pt)
  checks.push(
    raw.canonical
      ? check("Canonical URL", 2, raw.canonical, "pass", "")
      : check("Canonical URL", 2, "Missing", "warning", "Add a canonical link to avoid duplicate content issues")
  );

  const score = checks.reduce((s, c) => s + c.points, 0);
  return { name: "Meta Tags", score, maxScore: 25, checks };
}

function analyzeOpenGraph(raw: SeoRawData): SeoSection {
  const checks: SeoCheck[] = [];

  checks.push(
    raw.ogTitle
      ? check("og:title", 4, raw.ogTitle, "pass", "")
      : check("og:title", 4, "Missing", "fail", "Add og:title meta tag for social sharing")
  );

  checks.push(
    raw.ogDescription
      ? check("og:description", 4, raw.ogDescription.slice(0, 80) + (raw.ogDescription.length > 80 ? "..." : ""), "pass", "")
      : check("og:description", 4, "Missing", "fail", "Add og:description meta tag")
  );

  checks.push(
    raw.ogImage
      ? check("og:image", 5, raw.ogImage, "pass", "")
      : check("og:image", 5, "Missing", "fail", "Add og:image meta tag for social previews")
  );

  checks.push(
    raw.ogUrl
      ? check("og:url", 2, raw.ogUrl, "pass", "")
      : check("og:url", 2, "Missing", "warning", "Add og:url meta tag")
  );

  const score = checks.reduce((s, c) => s + c.points, 0);
  return { name: "Open Graph", score, maxScore: 15, checks };
}

function analyzeTwitterCard(raw: SeoRawData): SeoSection {
  const checks: SeoCheck[] = [];

  checks.push(
    raw.twitterCard
      ? check("twitter:card", 4, raw.twitterCard, "pass", "")
      : check("twitter:card", 4, "Missing", "fail", "Add twitter:card meta tag")
  );

  checks.push(
    raw.twitterTitle
      ? check("twitter:title", 3, raw.twitterTitle, "pass", "")
      : check("twitter:title", 3, "Missing", "warning", "Add twitter:title (falls back to og:title)")
  );

  checks.push(
    raw.twitterDescription
      ? check("twitter:description", 3, raw.twitterDescription.slice(0, 80) + (raw.twitterDescription.length > 80 ? "..." : ""), "pass", "")
      : check("twitter:description", 3, "Missing", "warning", "Add twitter:description (falls back to og:description)")
  );

  const score = checks.reduce((s, c) => s + c.points, 0);
  return { name: "Twitter Card", score, maxScore: 10, checks };
}

function analyzeHeadings(raw: SeoRawData): SeoSection {
  const checks: SeoCheck[] = [];
  const h1s = raw.headings.filter((h) => h.tag === "H1");

  // Single H1 (6pt)
  if (h1s.length === 1) {
    checks.push(check("Single H1", 6, h1s[0].text.slice(0, 60), "pass", ""));
  } else if (h1s.length === 0) {
    checks.push(check("Single H1", 6, "No H1 found", "fail", "Add exactly one H1 heading to your page"));
  } else {
    checks.push(check("Single H1", 6, `${h1s.length} H1 tags found`, "warning", "Use only one H1 per page"));
  }

  // H1 length (3pt)
  if (h1s.length > 0) {
    const len = h1s[0].text.length;
    checks.push(
      len >= 20 && len <= 70
        ? check("H1 length", 3, `${len} chars`, "pass", "")
        : check("H1 length", 3, `${len} chars`, "warning", "Keep H1 between 20-70 characters")
    );
  } else {
    checks.push(check("H1 length", 3, "N/A", "fail", "Add an H1 first"));
  }

  // Hierarchy (4pt) - check no skipping levels
  const levels = raw.headings.map((h) => parseInt(h.tag[1]));
  let hierarchyOk = true;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      hierarchyOk = false;
      break;
    }
  }
  checks.push(
    hierarchyOk && raw.headings.length > 0
      ? check("Heading hierarchy", 4, "Proper sequence", "pass", "")
      : raw.headings.length === 0
        ? check("Heading hierarchy", 4, "No headings", "fail", "Add structured headings to your page")
        : check("Heading hierarchy", 4, "Levels skipped", "warning", "Don't skip heading levels (e.g., H1 -> H3)")
  );

  // Has H2 (2pt)
  const hasH2 = raw.headings.some((h) => h.tag === "H2");
  checks.push(
    hasH2
      ? check("Has H2 subheadings", 2, `${raw.headings.filter((h) => h.tag === "H2").length} found`, "pass", "")
      : check("Has H2 subheadings", 2, "None", "warning", "Add H2 subheadings to structure your content")
  );

  const score = checks.reduce((s, c) => s + c.points, 0);
  return { name: "Headings", score, maxScore: 15, checks };
}

function analyzeImages(raw: SeoRawData): SeoSection {
  const checks: SeoCheck[] = [];
  const total = raw.images.length;

  if (total === 0) {
    checks.push(check("Images with alt text", 10, "No images found", "pass", ""));
    checks.push(check("No empty alt attributes", 5, "No images found", "pass", ""));
  } else {
    // % with alt (10pt)
    const withAlt = raw.images.filter((img) => img.alt !== null && img.alt.length > 0).length;
    const pct = Math.round((withAlt / total) * 100);
    const altPoints = Math.round((withAlt / total) * 10);
    checks.push(
      check(
        "Images with alt text",
        10,
        `${withAlt}/${total} (${pct}%)`,
        pct === 100 ? "pass" : pct >= 50 ? "warning" : "fail",
        pct < 100 ? "Add descriptive alt text to all images" : ""
      )
    );
    // Override points for proportional scoring
    checks[checks.length - 1].points = altPoints;

    // No empty alt (5pt)
    const emptyAlt = raw.images.filter((img) => img.alt !== null && img.alt.length === 0).length;
    checks.push(
      emptyAlt === 0
        ? check("No empty alt attributes", 5, "All good", "pass", "")
        : check("No empty alt attributes", 5, `${emptyAlt} empty`, "warning", "Replace empty alt=\"\" with descriptive text (unless decorative)")
    );
  }

  const score = checks.reduce((s, c) => s + c.points, 0);
  return { name: "Images", score, maxScore: 15, checks };
}

function analyzeLinks(raw: SeoRawData): SeoSection {
  const checks: SeoCheck[] = [];
  const internal = raw.links.filter((l) => !l.isExternal);
  const external = raw.links.filter((l) => l.isExternal);
  const hashLinks = raw.links.filter((l) => l.href === "#");

  // Internal links (4pt)
  checks.push(
    internal.length > 0
      ? check("Internal links", 4, `${internal.length} found`, "pass", "")
      : check("Internal links", 4, "None", "fail", "Add internal links to improve navigation and SEO")
  );

  // External links (2pt)
  checks.push(
    external.length > 0
      ? check("External links", 2, `${external.length} found`, "pass", "")
      : check("External links", 2, "None", "warning", "Consider adding relevant external links")
  );

  // No href="#" (4pt)
  checks.push(
    hashLinks.length === 0
      ? check("No placeholder links", 4, "All good", "pass", "")
      : check("No placeholder links", 4, `${hashLinks.length} href="#"`, "warning", "Replace href=\"#\" with actual URLs or use buttons")
  );

  const score = checks.reduce((s, c) => s + c.points, 0);
  return { name: "Links", score, maxScore: 10, checks };
}

function analyzeTechnical(raw: SeoRawData): SeoSection {
  const checks: SeoCheck[] = [];

  // Viewport (3pt)
  checks.push(
    raw.viewport
      ? check("Viewport meta", 3, raw.viewport, "pass", "")
      : check("Viewport meta", 3, "Missing", "fail", "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">")
  );

  // Charset (2pt)
  checks.push(
    raw.charset
      ? check("Charset", 2, raw.charset, "pass", "")
      : check("Charset", 2, "Missing", "warning", "Add <meta charset=\"utf-8\">")
  );

  // Lang (2pt)
  checks.push(
    raw.lang
      ? check("HTML lang attribute", 2, raw.lang, "pass", "")
      : check("HTML lang attribute", 2, "Missing", "warning", "Add lang attribute to <html> tag")
  );

  // Inline styles (1.5pt)
  checks.push(
    raw.inlineStyleCount <= 5
      ? check("Inline styles", 1.5, `${raw.inlineStyleCount} found`, "pass", "")
      : raw.inlineStyleCount <= 20
        ? check("Inline styles", 1.5, `${raw.inlineStyleCount} found`, "warning", "Reduce inline styles, use external CSS")
        : check("Inline styles", 1.5, `${raw.inlineStyleCount} found`, "fail", "Too many inline styles, move to CSS files")
  );

  // Scripts (1.5pt)
  checks.push(
    raw.scriptCount <= 5
      ? check("Script count", 1.5, `${raw.scriptCount} found`, "pass", "")
      : raw.scriptCount <= 15
        ? check("Script count", 1.5, `${raw.scriptCount} found`, "warning", "Consider reducing number of scripts")
        : check("Script count", 1.5, `${raw.scriptCount} found`, "fail", "Too many scripts, consider bundling")
  );

  const score = checks.reduce((s, c) => s + c.points, 0);
  return { name: "Technical", score, maxScore: 10, checks };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json() as { url: string };
  let { url } = body;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Ensure URL has protocol
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 422 }
      );
    }

    const html = await response.text();
    const raw = parseRawData(html, url);

    const sections: SeoSection[] = [
      analyzeMetaTags(raw),
      analyzeOpenGraph(raw),
      analyzeTwitterCard(raw),
      analyzeHeadings(raw),
      analyzeImages(raw),
      analyzeLinks(raw),
      analyzeTechnical(raw),
    ];

    const overallScore = Math.round(
      sections.reduce((s, sec) => s + sec.score, 0)
    );

    const result: SeoAuditResult = {
      url,
      analyzedAt: new Date().toISOString(),
      overallScore,
      sections,
      rawData: raw,
    };

    await prisma.project.update({
      where: { id },
      data: { seoAudit: JSON.stringify(result) },
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to analyze URL: ${message}` },
      { status: 500 }
    );
  }
}
