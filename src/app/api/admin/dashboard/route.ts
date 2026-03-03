import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/admin';
import { getAdminSupabase } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  totalAudits: number;
  emailsCaptured: number;
  playbooksSold: number;
  revenueTotal: number;
  auditsPerDay: { date: string; count: number }[];
  scoreDistribution: { bucket: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Assign a composite score to one of five buckets for the histogram.
 */
function scoreToBucket(score: number): string {
  if (score < 20) return '0-20';
  if (score < 40) return '20-40';
  if (score < 60) return '40-60';
  if (score < 80) return '60-80';
  return '80-100';
}

// ---------------------------------------------------------------------------
// GET /api/admin/dashboard — Aggregate dashboard stats
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // --- Auth check --------------------------------------------------------
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const supabase = getAdminSupabase();

    // --- Run queries in parallel -------------------------------------------
    const [
      auditsCountResult,
      emailsCountResult,
      playbooksCountResult,
      revenueResult,
      auditsLast30Result,
      scoresResult,
    ] = await Promise.all([
      // Total audits
      supabase
        .from('audits')
        .select('id', { count: 'exact', head: true }),

      // Emails captured (leads with non-null email)
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .not('email', 'is', null),

      // Playbooks sold (completed payments)
      supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),

      // Revenue total (sum of completed payment amounts)
      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed'),

      // Audits in the last 30 days (for per-day chart)
      supabase
        .from('audits')
        .select('created_at')
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ),

      // Score distribution
      supabase
        .from('audits')
        .select('composite_score')
        .not('composite_score', 'is', null),
    ]);

    // --- Compute aggregate values ------------------------------------------
    const totalAudits = auditsCountResult.count ?? 0;
    const emailsCaptured = emailsCountResult.count ?? 0;
    const playbooksSold = playbooksCountResult.count ?? 0;

    const revenueTotal = (revenueResult.data ?? []).reduce(
      (sum, row) => sum + (Number(row.amount) || 0),
      0
    );

    // --- Audits per day (last 30 days) -------------------------------------
    const dayCounts: Record<string, number> = {};
    for (const row of auditsLast30Result.data ?? []) {
      const date = row.created_at?.slice(0, 10); // YYYY-MM-DD
      if (date) {
        dayCounts[date] = (dayCounts[date] || 0) + 1;
      }
    }

    // Fill in all 30 days so the chart has no gaps
    const auditsPerDay: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      auditsPerDay.push({ date: key, count: dayCounts[key] || 0 });
    }

    // --- Score distribution histogram --------------------------------------
    const bucketCounts: Record<string, number> = {
      '0-20': 0,
      '20-40': 0,
      '40-60': 0,
      '60-80': 0,
      '80-100': 0,
    };
    for (const row of scoresResult.data ?? []) {
      const bucket = scoreToBucket(Number(row.composite_score));
      bucketCounts[bucket]++;
    }
    const scoreDistribution = Object.entries(bucketCounts).map(
      ([bucket, count]) => ({ bucket, count })
    );

    // --- Respond -----------------------------------------------------------
    const stats: DashboardStats = {
      totalAudits,
      emailsCaptured,
      playbooksSold,
      revenueTotal,
      auditsPerDay,
      scoreDistribution,
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error('[admin/dashboard] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
