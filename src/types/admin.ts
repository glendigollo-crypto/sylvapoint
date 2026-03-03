// ---------------------------------------------------------------------------
// Admin Types — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------

import type { AuditStatus, BusinessType, TierLevel } from './audit';

// ---------------------------------------------------------------------------
// Admin User (dashboard login)
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'viewer';
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
}

// ---------------------------------------------------------------------------
// Dashboard Stats — aggregate metrics for the admin dashboard
// ---------------------------------------------------------------------------

export interface ScoreDistributionBucket {
  /** Lower bound of the bucket (e.g. 0, 10, 20 ... 90). */
  bucket: number;
  count: number;
}

export interface AuditsPerDayEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface DashboardStats {
  total_audits: number;
  emails_captured: number;
  playbooks_sold: number;
  calls_booked: number;
  /** Audit-to-email conversion rate (0 – 1). */
  conversion_audit_to_email: number;
  /** Email-to-playbook conversion rate (0 – 1). */
  conversion_email_to_playbook: number;
  /** Lifetime revenue in cents. */
  revenue_total: number;
  score_distribution: ScoreDistributionBucket[];
  audits_per_day: AuditsPerDayEntry[];
}

// ---------------------------------------------------------------------------
// LeadRow — one row in the admin leads table
// ---------------------------------------------------------------------------

export interface LeadRow {
  id: string;
  email: string | null;
  name: string | null;
  company: string | null;
  source: string | null;
  nurture_status: string;
  nurture_step: number;
  unsubscribed: boolean;
  audit_count: number;
  latest_audit_score: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// AuditRow — one row in the admin audits table
// ---------------------------------------------------------------------------

export interface AuditRow {
  id: string;
  url: string;
  business_type: BusinessType;
  status: AuditStatus;
  composite_score: number | null;
  composite_grade: string | null;
  tier_unlocked: TierLevel;
  lead_email: string | null;
  created_at: string;
  completed_at: string | null;
}
