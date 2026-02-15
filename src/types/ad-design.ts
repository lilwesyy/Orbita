export interface AdFormat {
  id: string;
  label: string;
  category: "social" | "print";
  width: number;
  height: number;
  description: string;
}

export interface AdDesignSummary {
  id: string;
  format: string;
  prompt: string;
  sourceUrl: string | null;
  width: number;
  height: number;
  createdAt: Date;
}

export interface AdDesignFull extends AdDesignSummary {
  htmlContent: string;
  projectId: string;
}
