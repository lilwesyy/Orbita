export type SeoStatus = "pass" | "warning" | "fail";

export interface SeoCheck {
  label: string;
  status: SeoStatus;
  value: string;
  recommendation: string;
  points: number;
  maxPoints: number;
}

export interface SeoSection {
  name: string;
  score: number;
  maxScore: number;
  checks: SeoCheck[];
}

export interface SeoRawData {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  headings: { tag: string; text: string }[];
  images: { src: string; alt: string | null }[];
  links: { href: string; isExternal: boolean }[];
  viewport: string | null;
  charset: string | null;
  lang: string | null;
  inlineStyleCount: number;
  scriptCount: number;
}

export interface SeoAuditResult {
  url: string;
  analyzedAt: string;
  overallScore: number;
  sections: SeoSection[];
  rawData: SeoRawData;
}
