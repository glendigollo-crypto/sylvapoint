import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  checkAdminRateLimit,
  verifyAdminPassword,
  createAdminToken,
  recordLoginAttempt,
} from '@/lib/auth/admin';

// ---------------------------------------------------------------------------
// Validation schema (zod v4)
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email({ message: 'A valid email is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

// ---------------------------------------------------------------------------
// POST /api/admin/auth — Admin login
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // --- Parse & validate body ---------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 422 }
      );
    }

    const { email, password } = parsed.data;

    // --- Rate-limit check --------------------------------------------------
    const allowed = await checkAdminRateLimit(email);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // --- Verify password ---------------------------------------------------
    const valid = await verifyAdminPassword(password);
    if (!valid) {
      await recordLoginAttempt(email, false);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // --- Create token & set cookie -----------------------------------------
    const token = await createAdminToken(email);
    await recordLoginAttempt(email, true);

    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_token', token, {
      maxAge: 86400,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[admin/auth] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
