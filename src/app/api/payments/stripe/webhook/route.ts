import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent } from '@/lib/payments/stripe';

// ---------------------------------------------------------------------------
// Next.js route segment config
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/payments/stripe/webhook
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // --- Read raw body for signature verification --------------------------
    const payload = await request.text();

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe-Signature header' },
        { status: 400 },
      );
    }

    // --- Verify and process the webhook event ------------------------------
    await handleWebhookEvent(payload, signature);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[stripe/webhook] Error:', message);

    // Signature verification failures return 400; everything else is 500
    const isVerificationError = message.includes('signature verification failed');
    return NextResponse.json(
      { error: message },
      { status: isVerificationError ? 400 : 500 },
    );
  }
}
