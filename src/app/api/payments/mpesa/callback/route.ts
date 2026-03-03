import { NextRequest, NextResponse } from 'next/server';
import { handleCallback } from '@/lib/payments/mpesa';

// ---------------------------------------------------------------------------
// POST /api/payments/mpesa/callback
// ---------------------------------------------------------------------------
// M-Pesa expects an immediate 200 OK response regardless of whether our
// internal processing succeeds. If we return anything else, Safaricom may
// retry the callback repeatedly.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await handleCallback(body);
  } catch (err) {
    // Log but never return a non-200 — Safaricom expects 200 always
    console.error('[mpesa/callback] Error processing callback:', err);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' }, { status: 200 });
}
