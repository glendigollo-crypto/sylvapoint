// ---------------------------------------------------------------------------
// Core Audit Types — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------

/** Pipeline status for a single audit run. */
export type AuditStatus =
  | 'pending'
  | 'crawling'
  | 'analyzing'
  | 'scoring'
  | 'completed'
  | 'failed';

/** The three supported business archetypes. */
export type BusinessType = 'saas' | 'services' | 'info_product';

/** Content tier the user has unlocked. */
export type TierLevel = 'free' | 'gated' | 'paid';

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export interface Audit {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  url: string;
  business_type: BusinessType;
  target_clients: string | null;
  social_links: string | null;
  status: AuditStatus;
  current_step: string | null;
  progress_pct: number;
  composite_score: number | null;
  composite_grade: string | null;
  share_slug: string;
  tier_unlocked: TierLevel;
  top_gaps: TopGap[];
  error_message: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Top Gap (summary of lowest-scoring dimensions)
// ---------------------------------------------------------------------------

export interface TopGap {
  dimension_key: string;
  label: string;
  score: number;
  grade: string;
  quick_win: string;
}

// ---------------------------------------------------------------------------
// Form data submitted by the user to kick off an audit
// ---------------------------------------------------------------------------

export interface AuditFormData {
  url: string;
  business_type: BusinessType;
  target_clients: string;
  social_links?: string;
}

// ---------------------------------------------------------------------------
// Polling response returned while an audit is in progress
// ---------------------------------------------------------------------------

export interface AuditStatusResponse {
  status: AuditStatus;
  progress_pct: number;
  current_step: string | null;
  estimated_remaining_seconds: number | null;
}

// ---------------------------------------------------------------------------
// Lead (email-gate capture)
// ---------------------------------------------------------------------------

export interface Lead {
  id: string;
  tenant_id: string;
  email: string | null;
  name: string | null;
  company: string | null;
  source: string | null;
  nurture_status: string;
  nurture_step: number;
  unsubscribed: boolean;
  created_at: string;
  updated_at: string;
}
