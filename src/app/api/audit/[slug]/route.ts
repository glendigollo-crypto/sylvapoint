import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// GET /api/audit/[slug] — Retrieve audit results (tier-gated)
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

    const supabase = getAdminSupabase();

    const { data: audit, error } = await supabase
      .from('audits')
      .select('*')
      .eq('share_slug', slug)
      .single();

    if (error || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // ----- Not yet completed — return current status -----------------------
    if (audit.status !== 'completed') {
      return NextResponse.json({
        audit_id: audit.id,
        share_slug: audit.share_slug,
        status: audit.status,
        progress_pct: audit.progress_pct,
        current_step: audit.current_step,
        ...(audit.status === 'failed' && { error_message: audit.error_message }),
      });
    }

    // ----- Fetch dimension scores from separate table ----------------------
    const { data: dimRows } = await supabase
      .from('dimension_scores')
      .select('*')
      .eq('audit_id', audit.id)
      .order('dimension_key');

    // Map DB rows to the shape the frontend expects
    const dimensionScores = (dimRows ?? []).map((d: Record<string, unknown>) => ({
      dimension: d.dimension_key as string,
      label: (d.label as string) || '',
      score: Math.round((d.raw_score as number) ?? 0),
      grade: (d.grade as string) || 'F',
      summaryFree: (d.summary_free as string) || null,
      summaryGated: (d.summary_gated as string) || null,
      findings: (d.findings as unknown[]) ?? [],
      quickWins: (d.quick_wins as unknown[]) ?? [],
    }));

    // Build top_gaps from the 3 lowest-scoring dimensions
    const sortedDims = [...dimensionScores].sort((a, b) => a.score - b.score);
    const topGaps = sortedDims.slice(0, 3).map((d) => ({
      dimension_key: d.dimension,
      label: d.label,
      score: d.score,
      grade: d.grade,
      quick_win: d.quickWins?.[0]
        ? (d.quickWins[0] as { title?: string }).title ?? 'Improve this area'
        : 'Review and improve this dimension',
    }));

    // ----- Completed — gate enforcement ------------------------------------
    const basePayload = {
      audit_id: audit.id,
      share_slug: audit.share_slug,
      url: audit.url,
      business_type: audit.business_type,
      status: audit.status,
      composite_score: audit.composite_score,
      created_at: audit.created_at,
      completed_at: audit.completed_at,
    };

    if (audit.tier_unlocked === 'free') {
      // Free tier: scores + top gaps, but no findings/quick wins details
      const freeDimScores = dimensionScores.map((d) => ({
        dimension: d.dimension,
        label: d.label,
        score: d.score,
        grade: d.grade,
        summaryFree: d.summaryFree,
      }));

      return NextResponse.json({
        ...basePayload,
        tier: 'free',
        top_gaps: topGaps,
        dimension_scores: freeDimScores,
      });
    }

    // Gated or paid tier: return full data including findings & quick wins
    return NextResponse.json({
      ...basePayload,
      tier: audit.tier_unlocked,
      top_gaps: topGaps,
      dimension_scores: dimensionScores,
    });
  } catch (err) {
    console.error('[audit/get] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
