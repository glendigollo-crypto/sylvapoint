// ---------------------------------------------------------------------------
// Scoring Internal Types — SylvaPoint GTM Audit Tool
// Re-exports from @/types/scoring + internal types used by the scoring engine
// ---------------------------------------------------------------------------

export type {
  DimensionKey,
  DimensionScore,
  SubScore,
  Finding,
  QuickWin,
  ScoringResult,
  WeightProfile,
  CrawlExtraction,
} from '@/types/scoring';

// ---------------------------------------------------------------------------
// ScorerInput — the data package passed to each dimension scorer
// ---------------------------------------------------------------------------

export interface ScorerInput {
  audit_id: string;
  url: string;
  business_type: 'saas' | 'ecommerce' | 'marketplace' | 'services' | 'info_product' | 'enterprise';
  target_clients: string;
  industry?: string;
  extraction: import('@/types/scoring').CrawlExtraction;
  pagespeed?: PageSpeedResult;
  competitor?: CompetitorSnapshot;
}

// ---------------------------------------------------------------------------
// CompetitorSnapshot — lightweight competitor data from homepage fetch
// ---------------------------------------------------------------------------

/**
 * Build a compact prompt section from a CompetitorSnapshot.
 * Appended to scorer prompts for positioning, copy, and visual dimensions.
 */
export function buildCompetitorPromptSection(c: CompetitorSnapshot): string {
  const lines = [
    `\n## Competitor Reference: ${c.url}`,
    `- Meta title: ${c.metaTitle || '(none)'}`,
    `- Meta description: ${c.metaDescription || '(none)'}`,
    `- Headlines: ${c.headlines.slice(0, 8).join(' | ') || '(none detected)'}`,
    `- CTAs: ${c.ctaCount} found`,
    `- Forms: ${c.formCount} | Images: ${c.imageCount} | Video: ${c.hasVideo ? 'Yes' : 'No'}`,
    `- Testimonials: ${c.hasTestimonials ? 'Yes' : 'No'} | Pricing page: ${c.hasPricing ? 'Yes' : 'No'}`,
  ];
  if (c.techStack.length > 0) {
    lines.push(`- Tech stack: ${c.techStack.join(', ')}`);
  }
  if (c.pagespeedScore != null) {
    lines.push(`- PageSpeed performance score: ${c.pagespeedScore}/100`);
  }
  lines.push(
    '',
    'Note any areas where the competitor\'s GTM presence appears stronger or weaker. Reference these observations in findings where relevant.',
  );
  return lines.join('\n');
}

export interface CompetitorSnapshot {
  url: string;
  headlines: string[];
  ctaCount: number;
  formCount: number;
  imageCount: number;
  hasVideo: boolean;
  hasTestimonials: boolean;
  hasPricing: boolean;
  techStack: string[];
  metaTitle: string;
  metaDescription: string;
  pagespeedScore?: number;
}

// ---------------------------------------------------------------------------
// PageSpeedResult — Lighthouse / PageSpeed Insights data
// ---------------------------------------------------------------------------

export interface PageSpeedResult {
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
  audits: Record<
    string,
    { score: number | null; title: string; description: string }
  >;
}

// ---------------------------------------------------------------------------
// DimensionScorerResult — what each dimension scorer returns internally
// ---------------------------------------------------------------------------

export interface DimensionScorerResult {
  dimension_key: string;
  label: string;
  raw_score: number;
  sub_scores: Array<{
    key: string;
    label: string;
    score: number;
    weight: number;
    evidence: string;
    evidence_quotes: string[];
  }>;
  summary_free: string;
  summary_gated: string;
  findings: Array<{
    title: string;
    severity: 'critical' | 'warning' | 'info';
    evidence: string;
    recommendation: string;
    playbook_chapter?: string;
  }>;
  quick_wins: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'quick' | 'moderate' | 'involved';
  }>;
}
