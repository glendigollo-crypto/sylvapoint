import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { initiateSTKPush } from '@/lib/payments/mpesa';

// ---------------------------------------------------------------------------
// Validation schema (zod v4)
// ---------------------------------------------------------------------------

const initiateSchema = z.object({
  phone: z.string().min(1, { message: 'phone is required' }),
  amount: z.number().positive({ message: 'amount must be a positive number' }),
  audit_id: z.string().min(1, { message: 'audit_id is required' }),
  lead_id: z.string().min(1, { message: 'lead_id is required' }),
});

// ---------------------------------------------------------------------------
// POST /api/payments/mpesa/initiate
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
        { status: 400 },
      );
    }

    const parsed = initiateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 422 },
      );
    }

    const { phone, amount, audit_id, lead_id } = parsed.data;

    // --- Initiate STK Push -------------------------------------------------
    const result = await initiateSTKPush({
      phone,
      amount,
      auditId: audit_id,
      leadId: lead_id,
    });

    return NextResponse.json(
      { checkoutRequestId: result.checkoutRequestId },
      { status: 200 },
    );
  } catch (err) {
    console.error('[mpesa/initiate] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Failed to initiate M-Pesa payment';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
