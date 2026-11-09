/** A highlighted passage in the reader view. */
export interface FallacyData {
  id: string;
  type: string;
  excerpt?: string;
  mechanism?: string;
  motive?: string;
  explanation?: string;
  severity?: 'high' | 'medium' | 'low';
  betterAlternative?: string;
  missingContext?: string;
}

export interface BriefingArticle {
  title: string;
  url: string;
  source: string;
  lean?: string;
  publishDate: string | null;
  author?: string;
  content: string;
}

/** Summary analysis stored in the daily briefing (see toBriefingAnalysis in netlify/lib/analysis.mjs). */
export interface BriefingAnalysis {
  summary?: string | null;
  manipulationAnalysis?: {
    logicalFallacies?: Array<{ type: string; location: string; explanation: string }>;
  };
  biasAnalysis?: { direction: string; confidence: number; explanation: string };
  overallAssessment?: { reliabilityScore: number | null };
}

export interface BriefingStory {
  topic: string;
  category?: string;
  why?: string;
  article: BriefingArticle;
  analysis: BriefingAnalysis | null;
  outlets?: string[];
  leans?: string[];
  dayCount?: number;
}

export interface DailyBriefing {
  generatedAt: string;
  version: string;
  briefingDate?: string;
  isArchive?: boolean;
  selection?: { headlineCount: number; clusterCount: number; outletCount?: number; selectedAt: string } | null;
  order?: string[];
  topics: Record<string, BriefingStory>;
}
