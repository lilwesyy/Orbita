import type { AdFormat } from "@/types/ad-design";

export const AD_FORMATS: AdFormat[] = [
  // Social
  {
    id: "instagram-post",
    label: "Instagram Post",
    category: "social",
    width: 1080,
    height: 1080,
    description: "Square post for Instagram feed",
  },
  {
    id: "instagram-story",
    label: "Instagram Story",
    category: "social",
    width: 1080,
    height: 1920,
    description: "Vertical story for Instagram/Facebook",
  },
  {
    id: "facebook-post",
    label: "Facebook Post",
    category: "social",
    width: 1200,
    height: 630,
    description: "Landscape post for Facebook feed",
  },
  {
    id: "linkedin-post",
    label: "LinkedIn Post",
    category: "social",
    width: 1200,
    height: 627,
    description: "Professional post for LinkedIn",
  },
  // Print
  {
    id: "flyer-a4",
    label: "Flyer A4",
    category: "print",
    width: 794,
    height: 1123,
    description: "A4 portrait flyer (210×297mm)",
  },
  {
    id: "flyer-a5",
    label: "Flyer A5",
    category: "print",
    width: 559,
    height: 794,
    description: "A5 portrait flyer (148×210mm)",
  },
  {
    id: "business-card",
    label: "Business Card",
    category: "print",
    width: 340,
    height: 200,
    description: "Standard business card (85×50mm)",
  },
  {
    id: "brochure-trifold",
    label: "Brochure Trifold",
    category: "print",
    width: 1123,
    height: 794,
    description: "Trifold brochure landscape (A4)",
  },
];

export function getFormatById(id: string): AdFormat | undefined {
  return AD_FORMATS.find((f) => f.id === id);
}
