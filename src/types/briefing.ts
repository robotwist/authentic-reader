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
  republishable?: boolean;
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

export interface CheckedClaim {
  claim: string;
  quote?: string;
  verification_status: 'verified' | 'unverified' | 'disputed' | 'false' | 'needs_context';
  checked?: boolean;
  notes: string;
  sources?: Array<{ title: string; url: string }>;
}

/** An opinion column weighed on the quality of its argument (see toBriefingOpinion in netlify/lib/opinion.mjs). */
export interface BriefingOpinion {
  side: 'left' | 'right';
  relatedStory: string | null;
  article: BriefingArticle;
  thesis: string;
  argumentScore: { overall: number; evidence: number; logic: number; fairness: number; clarity: number; explanation: string };
  strengths: Array<{ point: string; quote: string }>;
  weaknesses: Array<{ type: string; quote: string; explanation: string; fair_version?: string; severity?: 'low' | 'medium' | 'high' }>;
  strongestCounterargument: string;
  claims: CheckedClaim[];
  verdict: string;
}

export interface DailyBriefing {
  generatedAt: string;
  version: string;
  briefingDate?: string;
  isArchive?: boolean;
  selection?: { headlineCount: number; clusterCount: number; outletCount?: number; selectedAt: string } | null;
  order?: string[];
  topics: Record<string, BriefingStory>;
  opinions?: Partial<Record<'left' | 'right', BriefingOpinion>>;
}
