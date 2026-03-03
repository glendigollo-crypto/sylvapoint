// ---------------------------------------------------------------------------
// Scoring Types — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------

import type { BusinessType, TopGap } from './audit';

// ---------------------------------------------------------------------------
// Dimension keys (the six pillars of the audit)
// ---------------------------------------------------------------------------

export type DimensionKey =
  | 'positioning'
  | 'copy'
  | 'seo'
  | 'lead_capture'
  | 'performance'
  | 'visual';

// ---------------------------------------------------------------------------
// Grade string — A+ through F
// ---------------------------------------------------------------------------

export type Grade =
  | 'A+'
  | 'A'
  | 'A-'
  | 'B+'
  | 'B'
  | 'B-'
  | 'C+'
  | 'C'
  | 'C-'
  | 'D+'
  | 'D'
  | 'D-'
  | 'F';

// ---------------------------------------------------------------------------
// Severity & impact / effort levels
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'warning' | 'info';
export type Impact = 'high' | 'medium' | 'low';
export type Effort = 'quick' | 'moderate' | 'involved';

// ---------------------------------------------------------------------------
// SubScore — a scored component within a dimension
// ---------------------------------------------------------------------------

export interface SubScore {
  key: string;
  label: string;
  score: number;
  weight: number;
  evidence: string;
  evidenceQuotes: string[];
}

// ---------------------------------------------------------------------------
// Finding — an individual observation surfaced during analysis
// ---------------------------------------------------------------------------

export interface Finding {
  title: string;
  severity: Severity;
  evidence: string;
  recommendation: string;
  playbook_chapter: string | null;
}

// ---------------------------------------------------------------------------
// QuickWin — a concrete, actionable improvement
// ---------------------------------------------------------------------------

export interface QuickWin {
  title: string;
  description: string;
  impact: Impact;
  effort: Effort;
  dimension_key: DimensionKey;
}

// ---------------------------------------------------------------------------
// DimensionScore — the full scoring output for one dimension
// ---------------------------------------------------------------------------

export interface DimensionScore {
  dimension: DimensionKey;
  label: string;
  /** 0 – 100 */
  score: number;
  grade: Grade;
  subScores: SubScore[];
  /** Free-tier summary text (always visible). */
  summaryFree: string;
  /** Gated summary text (shown after email capture). */
  summaryGated: string;
  findings: Finding[];
  quickWins: QuickWin[];
}

// ---------------------------------------------------------------------------
// ScoringResult — the top-level output of the scoring pipeline
// ---------------------------------------------------------------------------

export interface ScoringResult {
  audit_id: string;
  composite_score: number;
  composite_grade: Grade;
  dimensions: DimensionScore[];
  top_gaps: TopGap[];
}

// ---------------------------------------------------------------------------
// WeightProfile — per-business-type weighting for a dimension
// ---------------------------------------------------------------------------

export interface WeightProfile {
  business_type: BusinessType;
  dimension_key: DimensionKey;
  /** Overall weight of this dimension for the business type (0 – 1). */
  dimension_weight: number;
  /** Keyed by sub-score key; values are relative weights within the dimension. */
  sub_weights: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Crawl Extraction — structured data pulled from a crawled page
// ---------------------------------------------------------------------------

export interface Headline {
  text: string;
  level: number; // 1–6
}

export interface FormAnalysis {
  action: string | null;
  method: string;
  fields: FormField[];
  hasCaptcha: boolean;
  hasEmailField: boolean;
  hasPhoneField: boolean;
}

export interface FormField {
  name: string;
  type: string;
  label: string | null;
  required: boolean;
  placeholder: string | null;
}

export interface ImageData {
  src: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  isAboveFold: boolean;
  isHero: boolean;
  fileSize: number | null;
  format: string | null;
}

export interface VideoEmbed {
  src: string;
  platform: 'youtube' | 'vimeo' | 'wistia' | 'loom' | 'other';
  title: string | null;
  isAboveFold: boolean;
}

export interface Quote {
  text: string;
  author: string | null;
  role: string | null;
  company: string | null;
  avatarUrl: string | null;
}

export interface PricingItem {
  planName: string | null;
  price: string | null;
  interval: string | null;
  features: string[];
  ctaText: string | null;
  highlighted: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProofItem {
  type: 'stat' | 'logo' | 'badge' | 'certification' | 'case_study' | 'other';
  text: string;
  imageUrl: string | null;
}

export interface CrawlExtraction {
  headlines: Headline[];
  ctas: string[];
  forms: FormAnalysis[];
  images: ImageData[];
  videos: VideoEmbed[];
  testimonials: Quote[];
  pricing: PricingItem[];
  faq: FaqItem[];
  proof: ProofItem[];
}
