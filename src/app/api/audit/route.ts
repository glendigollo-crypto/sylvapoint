import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { inngest } from '@/inngest/client';

// ---------------------------------------------------------------------------
// Validation schema (zod v4)
// ---------------------------------------------------------------------------

const auditRequestSchema = z.object({
  url: z.string().url('A valid URL is required'),
  business_type: z.enum(['saas', 'services', 'info_product'], {
    message: 'business_type must be one of: saas, services, info_product',
  }),
  target_clients: z
    .string()
    .min(1, 'target_clients is required')
    .max(500, 'target_clients must be 500 characters or fewer'),
  social_links: z.string().max(1000).optional().default(''),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateShareSlug(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return nanoid(10)
    .split('')
    .map((ch) => alphabet[Math.abs(ch.charCodeAt(0)) % alphabet.length])
    .join('');
}

// ---------------------------------------------------------------------------
// POST /api/audit — Start a new GTM audit
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // --- Parse & validate body -----------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const parsed = auditRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 422 }
      );
    }

    const { url, business_type, target_clients, social_links } = parsed.data;

    // --- Create the audit record --------------------------------------------
    const share_slug = generateShareSlug();
    const supabase = getAdminSupabase();

    const { data: audit, error: insertError } = await supabase
      .from('audits')
      .insert({
        url,
        business_type,
        target_clients,
        social_links,
        share_slug,
        status: 'pending',
        progress_pct: 0,
        current_step: 'pending',
        tier_unlocked: 'free',
      })
      .select('id, share_slug, status')
      .single();

    if (insertError || !audit) {
      console.error('[audit/create] Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create audit record' },
        { status: 500 }
      );
    }

    // --- Dispatch the Inngest pipeline --------------------------------------
    await inngest.send({
      name: 'audit/start',
      data: {
        audit_id: audit.id,
        url,
        business_type,
        target_clients,
        social_links: social_links ?? '',
      },
    });

    // --- Respond 202 Accepted -----------------------------------------------
    return NextResponse.json(
      {
        audit_id: audit.id,
        share_slug: audit.share_slug,
        status: 'pending',
      },
      { status: 202 }
    );
  } catch (err) {
    console.error('[audit/create] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
