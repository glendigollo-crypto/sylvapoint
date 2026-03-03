// ---------------------------------------------------------------------------
// Constants — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------

import type { DimensionKey, Grade } from '@/types/scoring';

// ---------------------------------------------------------------------------
// Dimension labels (human-readable names for each pillar)
// ---------------------------------------------------------------------------

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  positioning: 'Positioning & Messaging',
  copy: 'Copy & Persuasion',
  seo: 'SEO & Discoverability',
  lead_capture: 'Lead Capture & CTAs',
  performance: 'Performance & Speed',
  visual: 'Visual & UX Design',
} as const;

// ---------------------------------------------------------------------------
// Dimension icons (maps to lucide-react icon names)
// ---------------------------------------------------------------------------

export const DIMENSION_ICONS: Record<DimensionKey, string> = {
  positioning: 'Target',
  copy: 'PenTool',
  seo: 'Search',
  lead_capture: 'Magnet',
  performance: 'Gauge',
  visual: 'Eye',
} as const;

// ---------------------------------------------------------------------------
// Grade thresholds — evaluated top-to-bottom; first match wins
// ---------------------------------------------------------------------------

export interface GradeThreshold {
  min: number;
  grade: Grade;
}

export const GRADE_THRESHOLDS: GradeThreshold[] = [
  { min: 95, grade: 'A+' },
  { min: 90, grade: 'A' },
  { min: 87, grade: 'A-' },
  { min: 83, grade: 'B+' },
  { min: 80, grade: 'B' },
  { min: 77, grade: 'B-' },
  { min: 73, grade: 'C+' },
  { min: 70, grade: 'C' },
  { min: 67, grade: 'C-' },
  { min: 63, grade: 'D+' },
  { min: 60, grade: 'D' },
  { min: 57, grade: 'D-' },
  { min: 0, grade: 'F' },
] as const;

// ---------------------------------------------------------------------------
// AI "tell words" — phrases commonly over-used by LLM-generated copy
// ---------------------------------------------------------------------------

export const AI_TELL_WORDS: string[] = [
  'delve',
  'comprehensive',
  'leverage',
  'crucial',
  'landscape',
  'tapestry',
  'multifaceted',
  'navigate',
  'robust',
  'streamline',
  'holistic',
  'synergy',
  'paradigm',
  'empower',
  'cutting-edge',
  'game-changer',
  'unlock',
  'dive into',
  "in today's",
  "it's important to note",
  'in conclusion',
  'at the end of the day',
];

// ---------------------------------------------------------------------------
// Default tenant (used for anonymous / single-tenant mode)
// ---------------------------------------------------------------------------

export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// ---------------------------------------------------------------------------
// Audit pipeline steps with estimated durations
// ---------------------------------------------------------------------------

export interface AuditStep {
  key: string;
  label: string;
  estimatedSeconds: number;
}

export const AUDIT_STEPS: AuditStep[] = [
  { key: 'init', label: 'Initializing audit', estimatedSeconds: 2 },
  { key: 'crawl', label: 'Crawling website pages', estimatedSeconds: 15 },
  { key: 'extract', label: 'Extracting page elements', estimatedSeconds: 5 },
  { key: 'analyze_positioning', label: 'Analyzing positioning & messaging', estimatedSeconds: 8 },
  { key: 'analyze_copy', label: 'Analyzing copy & persuasion', estimatedSeconds: 8 },
  { key: 'analyze_seo', label: 'Analyzing SEO signals', estimatedSeconds: 6 },
  { key: 'analyze_lead_capture', label: 'Analyzing lead capture & CTAs', estimatedSeconds: 6 },
  { key: 'analyze_performance', label: 'Analyzing performance & speed', estimatedSeconds: 5 },
  { key: 'analyze_visual', label: 'Analyzing visual & UX design', estimatedSeconds: 6 },
  { key: 'score', label: 'Computing scores & grades', estimatedSeconds: 3 },
  { key: 'gaps', label: 'Identifying top gaps & quick wins', estimatedSeconds: 3 },
  { key: 'finalize', label: 'Finalizing report', estimatedSeconds: 2 },
];

// ---------------------------------------------------------------------------
// Crawl settings
// ---------------------------------------------------------------------------

/** Maximum number of pages to crawl per audit. */
export const MAX_PAGES_CRAWL = 6;

/** Per-page crawl timeout in milliseconds (20 seconds). */
export const CRAWL_TIMEOUT_MS = 20_000;

// ---------------------------------------------------------------------------
// Cache TTL
// ---------------------------------------------------------------------------

/** Scoring result cache time-to-live in milliseconds (24 hours). */
export const SCORE_CACHE_TTL_MS = 86_400_000;
