import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Estimated total duration of a full audit run, in seconds. */
const ESTIMATED_TOTAL_SECONDS = 45;

// ---------------------------------------------------------------------------
// GET /api/audit/[slug]/status — Lightweight polling endpoint
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid slug' }, { status: 400 });
    }

    const { data: audit, error } = await getAdminSupabase()
      .from('audits')
      .select('status, progress_pct, current_step, error_message')
      .eq('share_slug', slug)
      .single();

    if (error || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    const progressPct: number = audit.progress_pct ?? 0;
    const remainingFraction = (100 - progressPct) / 100;
    const estimatedRemainingSeconds =
      audit.status === 'completed' || audit.status === 'failed'
        ? 0
        : Math.ceil(remainingFraction * ESTIMATED_TOTAL_SECONDS);

    return NextResponse.json(
      {
        status: audit.status,
        progress_pct: progressPct,
        current_step: audit.current_step,
        estimated_remaining_seconds: estimatedRemainingSeconds,
        ...(audit.status === 'failed' && { error_message: audit.error_message }),
      },
      {
        headers: {
          // Discourage aggressive caching on polling responses
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('[audit/status] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
