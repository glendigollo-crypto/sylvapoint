import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sendAuditReport, scheduleNurtureSequence } from '@/lib/email/resend';
import { getTenantId } from '@/lib/tenant';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const unlockRequestSchema = z.object({
  email: z.string().email('A valid email address is required'),
  name: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/audit/[slug]/unlock — Email gate to unlock full report
// ---------------------------------------------------------------------------

function getGradeFromScore(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D+';
  if (score >= 45) return 'D';
  if (score >= 40) return 'D-';
  return 'F';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid slug' }, { status: 400 });
    }

    // --- Parse & validate body -----------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const parsed = unlockRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { email, name, company } = parsed.data;
    const supabase = getAdminSupabase();

    // --- Fetch the audit ----------------------------------------------------
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, status, tier_unlocked, share_slug, composite_score, url, business_type')
      .eq('share_slug', slug)
      .single();

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    if (audit.status !== 'completed') {
      return NextResponse.json(
        { error: 'Audit is not yet completed. Please wait for it to finish.' },
        { status: 409 }
      );
    }

    // --- Upsert the lead ----------------------------------------------------
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .upsert(
        {
          email,
          name: name ?? null,
          company: company ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('[audit/unlock] Lead upsert error:', leadError);
      return NextResponse.json({ error: 'Failed to save lead information' }, { status: 500 });
    }

    // --- Link lead to audit & upgrade tier ----------------------------------
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        lead_id: lead.id,
        tier_unlocked: 'gated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', audit.id);

    if (updateError) {
      console.error('[audit/unlock] Audit update error:', updateError);
      return NextResponse.json({ error: 'Failed to unlock audit' }, { status: 500 });
    }

    // --- Track analytics event ----------------------------------------------
    await supabase.from('analytics_events').insert({
      tenant_id: getTenantId(request),
      event_type: 'email_captured',
      audit_id: audit.id,
      lead_id: lead.id,
      properties: { email, share_slug: slug },
    });

    // --- Fetch dimension scores from separate table -------------------------
    const { data: dimRows } = await supabase
      .from('dimension_scores')
      .select('*')
      .eq('audit_id', audit.id)
      .order('dimension_key');

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

    // Build top_gaps
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

    // --- Send report email + schedule nurture (fire-and-forget) -------------
    const score = Math.round(audit.composite_score ?? 0);
    const grade = getGradeFromScore(score);

    // Don't await — let these run in background
    sendAuditReport({
      email,
      auditId: slug,
      score,
      grade,
      topGaps,
    }).catch((err) => {
      console.error('[audit/unlock] Failed to send report email:', err);
    });

    scheduleNurtureSequence({
      leadId: lead.id,
      email,
      auditId: slug,
    }).catch((err) => {
      console.error('[audit/unlock] Failed to schedule nurture:', err);
    });

    // --- Return the full (gated) audit data ---------------------------------
    return NextResponse.json({
      audit_id: audit.id,
      share_slug: audit.share_slug,
      url: audit.url,
      business_type: audit.business_type,
      status: audit.status,
      tier: 'gated',
      composite_score: audit.composite_score,
      top_gaps: topGaps,
      dimension_scores: dimensionScores,
    });
  } catch (err) {
    console.error('[audit/unlock] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
