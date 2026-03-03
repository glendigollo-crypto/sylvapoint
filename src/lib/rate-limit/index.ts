// ---------------------------------------------------------------------------
// Rate Limiting — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Layered rate-limiting strategy backed by Supabase. Authenticated users
// (with email) get unlimited audits. Anonymous users are limited to 1 free
// audit per fingerprint+IP combination within a 30-day window.
// ---------------------------------------------------------------------------

import { getAdminSupabase } from '@/lib/supabase/admin';
import { getTenantId } from '@/lib/tenant';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitParams {
  fingerprint?: string;
  ip?: string;
  email?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of free anonymous audits per fingerprint+IP combo. */
const ANONYMOUS_LIMIT = 1;

/** TTL in days for rate limit records. */
const TTL_DAYS = 30;

// ---------------------------------------------------------------------------
// Public API: Check Rate Limit
// ---------------------------------------------------------------------------

/**
 * Check whether the caller is allowed to run another audit.
 *
 * Layered strategy (highest priority first):
 * 1. **Email** — Users who have provided an email get unlimited audits.
 * 2. **Fingerprint** — Browser fingerprint rate limiting.
 * 3. **IP** — Fallback IP-based rate limiting.
 *
 * Anonymous users (no email) are limited to ANONYMOUS_LIMIT audits per
 * unique fingerprint+IP combination within a 30-day rolling window.
 *
 * @param params - At least one of fingerprint, ip, or email.
 * @returns Whether the request is allowed, with reason and remaining count.
 */
export async function checkRateLimit(
  params: RateLimitParams,
): Promise<RateLimitResult> {
  const { fingerprint, ip, email } = params;

  // Layer 1: Authenticated users (email) are unlimited
  if (email) {
    return { allowed: true, remaining: undefined };
  }

  // Layer 2/3: Anonymous rate limiting via fingerprint + IP
  if (!fingerprint && !ip) {
    // No identifier at all — deny to prevent abuse
    return {
      allowed: false,
      reason: 'No client identifier provided',
      remaining: 0,
    };
  }

  try {
    const count = await getRecentAuditCount(fingerprint, ip);
    const remaining = Math.max(0, ANONYMOUS_LIMIT - count);

    if (count >= ANONYMOUS_LIMIT) {
      return {
        allowed: false,
        reason:
          'Free audit limit reached. Provide your email to unlock unlimited audits.',
        remaining: 0,
      };
    }

    return {
      allowed: true,
      remaining,
    };
  } catch (error) {
    // On DB failure, allow the request (fail-open) to avoid blocking users
    console.error(
      '[rate-limit] Failed to check rate limit:',
      error instanceof Error ? error.message : error,
    );
    return { allowed: true, remaining: undefined };
  }
}

// ---------------------------------------------------------------------------
// Public API: Record Audit
// ---------------------------------------------------------------------------

/**
 * Record that an audit was performed by this client.
 *
 * For each available identifier (fingerprint, ip, email), upserts a row
 * in the rate_limits table: increments audit_count if it exists, otherwise
 * inserts a new row.
 *
 * @param params - Client identifiers (fingerprint, IP, and/or email).
 */
export async function recordAudit(params: RateLimitParams): Promise<void> {
  const { fingerprint, ip, email } = params;
  const tenantId = getTenantId();
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const identifiers: { value: string; type: 'fingerprint' | 'ip' | 'email' }[] = [];
  if (fingerprint) identifiers.push({ value: fingerprint, type: 'fingerprint' });
  if (ip) identifiers.push({ value: ip, type: 'ip' });
  if (email) identifiers.push({ value: email, type: 'email' });

  for (const { value, type } of identifiers) {
    try {
      // Check if row exists
      const { data: existing } = await supabase
        .from('rate_limits')
        .select('id, audit_count')
        .eq('tenant_id', tenantId)
        .eq('identifier', value)
        .eq('identifier_type', type)
        .single();

      if (existing) {
        // Increment existing count
        await supabase
          .from('rate_limits')
          .update({
            audit_count: existing.audit_count + 1,
            last_audit_at: now,
          })
          .eq('id', existing.id);
      } else {
        // Insert new row
        await supabase.from('rate_limits').insert({
          tenant_id: tenantId,
          identifier: value,
          identifier_type: type,
          audit_count: 1,
          last_audit_at: now,
        });
      }
    } catch (error) {
      // Non-critical — log but don't throw
      console.error(
        `[rate-limit] Failed to record audit for ${type}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Get the maximum audit_count across all matching identifiers within the
 * TTL window.
 *
 * Runs separate queries per identifier to avoid unreliable PostgREST
 * nested `and()` inside `.or()`.
 */
async function getRecentAuditCount(
  fingerprint?: string,
  ip?: string,
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - TTL_DAYS);
  const cutoff = cutoffDate.toISOString();

  const tenantId = getTenantId();
  const supabase = getAdminSupabase();
  let maxCount = 0;

  const identifiers: { value: string; type: string }[] = [];
  if (fingerprint) identifiers.push({ value: fingerprint, type: 'fingerprint' });
  if (ip) identifiers.push({ value: ip, type: 'ip' });

  for (const { value, type } of identifiers) {
    try {
      const { data, error } = await supabase
        .from('rate_limits')
        .select('audit_count')
        .eq('tenant_id', tenantId)
        .eq('identifier', value)
        .eq('identifier_type', type)
        .gte('last_audit_at', cutoff)
        .single();

      if (!error && data) {
        maxCount = Math.max(maxCount, data.audit_count);
      }
    } catch {
      // Individual query failure — skip this identifier
    }
  }

  return maxCount;
}
