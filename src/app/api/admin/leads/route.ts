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
  search: z.string().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/admin/leads — Paginated leads list
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
      search: searchParams.get('search') ?? undefined,
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

    const { page, limit, search } = parsed.data;
    const offset = (page - 1) * limit;

    // --- Build query -------------------------------------------------------
    const supabase = getAdminSupabase();

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data: leads, count, error } = await query;

    if (error) {
      console.error('[admin/leads] Supabase query error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      leads: leads ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('[admin/leads] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
