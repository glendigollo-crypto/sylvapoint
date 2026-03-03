import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession, type ProductType } from '@/lib/payments/stripe';

// ---------------------------------------------------------------------------
// Validation schema (zod v4)
// ---------------------------------------------------------------------------

const checkoutSchema = z.object({
  audit_id: z.string().min(1, { message: 'audit_id is required' }),
  lead_id: z.string().min(1, { message: 'lead_id is required' }),
  product_type: z.enum(['playbook_basic', 'playbook_premium'], {
    message: 'product_type must be playbook_basic or playbook_premium',
  }),
  email: z.string().email({ message: 'A valid email is required' }).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/payments/stripe/checkout
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

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 422 },
      );
    }

    const { audit_id, lead_id, product_type, email } = parsed.data;

    // --- Build success / cancel URLs from request origin -------------------
    const origin = request.nextUrl.origin;
    const successUrl = `${origin}/audit/${audit_id}?payment=success`;
    const cancelUrl = `${origin}/audit/${audit_id}?payment=cancelled`;

    // --- Create Stripe Checkout Session ------------------------------------
    const result = await createCheckoutSession({
      auditId: audit_id,
      leadId: lead_id,
      productType: product_type as ProductType,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json(
      { sessionId: result.sessionId, url: result.url },
      { status: 200 },
    );
  } catch (err) {
    console.error('[stripe/checkout] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
