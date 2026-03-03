import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminToken } from '@/lib/auth/admin';
import { getAdminSupabase } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Query param validation (zod v4)
// ---------------------------------------------------------------------------

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  business_type: z.string().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/admin/audits — Paginated audits list
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

    // --- Parse query params ------------------------------------------------
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      business_type: searchParams.get('business_type') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 422 }
      );
    }

    const { page, limit, status, business_type } = parsed.data;
    const offset = (page - 1) * limit;

    // --- Build query -------------------------------------------------------
    const supabase = getAdminSupabase();

    let query = supabase
      .from('audits')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (business_type) {
      query = query.eq('business_type', business_type);
    }

    const { data: audits, count, error } = await query;

    if (error) {
      console.error('[admin/audits] Supabase query error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch audits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      audits: audits ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('[admin/audits] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
