export type LogoVariantType = "square" | "horizontal";

export interface LogoVariant {
  variant: LogoVariantType;
  url: string;
  width: number;
  height: number;
}

export interface FaviconSet {
  favicon16: string;
  favicon32: string;
  favicon180: string;
}

export interface BrandProfile {
  sourceUrl: string;
  colors: string[];
  fonts: string[];
  style: string;
  tone: string;
  logoDescription: string;
  industry: string;
  analyzedAt: string;
  logos?: LogoVariant[];
  favicons?: FaviconSet;
}
