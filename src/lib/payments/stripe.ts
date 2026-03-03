// ---------------------------------------------------------------------------
// Stripe Integration — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Creates checkout sessions for playbook purchases and handles webhook
// events for payment lifecycle management.
// ---------------------------------------------------------------------------

import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DEFAULT_TENANT_ID } from '@/lib/tenant';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProductType = 'playbook_basic' | 'playbook_premium';

export interface CreateCheckoutParams {
  auditId: string;
  leadId: string;
  productType: ProductType;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  sessionId: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Map product types to their Stripe price IDs.
 * These should be configured as environment variables in production.
 */
function getPriceId(productType: ProductType): string {
  const envKey =
    productType === 'playbook_basic'
      ? 'STRIPE_PRICE_ID_BASIC'
      : 'STRIPE_PRICE_ID_PREMIUM';

  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(
      `Missing environment variable: ${envKey}. ` +
        'Configure your Stripe price IDs in .env.local.',
    );
  }
  return priceId;
}

// ---------------------------------------------------------------------------
// Stripe client singleton
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'Missing environment variable: STRIPE_SECRET_KEY. ' +
        'Add it to your .env.local file.',
    );
  }

  _stripe = new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  });

  return _stripe;
}

// ---------------------------------------------------------------------------
// Checkout Session
// ---------------------------------------------------------------------------

/**
 * Create a Stripe Checkout Session for a playbook purchase.
 *
 * Embeds the audit ID and lead ID as metadata so the webhook handler
 * can link the payment back to the correct audit and lead.
 *
 * @param params - Checkout parameters including audit/lead IDs and URLs.
 * @returns The Checkout Session ID and redirect URL.
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams,
): Promise<CheckoutResult> {
  const stripe = getStripe();
  const priceId = getPriceId(params.productType);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      audit_id: params.auditId,
      lead_id: params.leadId,
      product_type: params.productType,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    // Pre-fill customer email if we have one via the lead
    ...(await getCustomerEmail(params.leadId)),
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Look up the lead's email from Supabase so Stripe can pre-fill it.
 */
async function getCustomerEmail(
  leadId: string,
): Promise<{ customer_email?: string }> {
  try {
    const { data } = await supabaseAdmin
      .from('leads')
      .select('email')
      .eq('id', leadId)
      .single();

    if (data?.email) {
      return { customer_email: data.email };
    }
  } catch {
    // Non-critical — proceed without pre-filling
  }
  return {};
}

// ---------------------------------------------------------------------------
// Webhook Handler
// ---------------------------------------------------------------------------

/**
 * Verify and process a Stripe webhook event.
 *
 * Handles the following events:
 * - `checkout.session.completed` — Unlock paid tier for the audit.
 * - `payment_intent.payment_failed` — Log the failure.
 * - `charge.refunded` — Revert the audit to gated tier.
 *
 * @param payload - Raw request body string.
 * @param signature - Stripe-Signature header value.
 */
export async function handleWebhookEvent(
  payload: string,
  signature: string,
): Promise<void> {
  const stripe = getStripe();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error(
      'Missing environment variable: STRIPE_WEBHOOK_SECRET. ' +
        'Add it to your .env.local file.',
    );
  }

  // Verify the event came from Stripe
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Stripe webhook signature verification failed: ${message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;

    default:
      // Unhandled event type — log but don't error
      console.log(`[stripe] Unhandled webhook event: ${event.type}`);
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const auditId = session.metadata?.audit_id;
  const leadId = session.metadata?.lead_id;
  const productType = session.metadata?.product_type as ProductType | undefined;

  if (!auditId) {
    console.error('[stripe] checkout.session.completed missing audit_id metadata');
    return;
  }

  // Unlock the paid tier on the audit
  const { error: auditError } = await supabaseAdmin
    .from('audits')
    .update({
      tier_unlocked: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', auditId);

  if (auditError) {
    console.error('[stripe] Failed to update audit tier:', auditError.message);
  }

  // Record the payment
  const { error: paymentError } = await supabaseAdmin.from('payments').insert({
    tenant_id: DEFAULT_TENANT_ID,
    audit_id: auditId,
    lead_id: leadId ?? null,
    provider: 'stripe',
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent as string | null,
    product_type: productType ?? 'playbook_basic',
    amount: (session.amount_total ?? 0) / 100,
    currency: session.currency ?? 'usd',
    status: 'completed',
  });

  if (paymentError) {
    console.error('[stripe] Failed to record payment:', paymentError.message);
  }

  console.log(
    `[stripe] Checkout completed: audit=${auditId}, product=${productType}`,
  );
}

async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  const auditId = paymentIntent.metadata?.audit_id;

  console.warn(
    `[stripe] Payment failed: pi=${paymentIntent.id}, audit=${auditId ?? 'unknown'}, ` +
      `reason=${paymentIntent.last_payment_error?.message ?? 'unknown'}`,
  );

  // Record the failure
  if (auditId) {
    await supabaseAdmin.from('payments').insert({
      tenant_id: DEFAULT_TENANT_ID,
      audit_id: auditId,
      lead_id: paymentIntent.metadata?.lead_id ?? null,
      provider: 'stripe',
      stripe_payment_intent: paymentIntent.id,
      product_type: (paymentIntent.metadata?.product_type as ProductType) ?? 'playbook_basic',
      amount: (paymentIntent.amount ?? 0) / 100,
      currency: paymentIntent.currency ?? 'usd',
      status: 'failed',
    });

    // Log error details in analytics
    await supabaseAdmin.from('analytics_events').insert({
      tenant_id: DEFAULT_TENANT_ID,
      event_type: 'payment_failed',
      audit_id: auditId,
      lead_id: paymentIntent.metadata?.lead_id ?? null,
      properties: {
        provider: 'stripe',
        payment_intent: paymentIntent.id,
        error_message: paymentIntent.last_payment_error?.message ?? null,
      },
    });
  }
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  // Find the associated audit via the payment intent
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.warn('[stripe] charge.refunded has no payment_intent');
    return;
  }

  // Look up the payment by payment intent ID
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('audit_id')
    .eq('stripe_payment_intent', paymentIntentId)
    .eq('status', 'completed')
    .single();

  if (!payment) {
    console.warn(
      `[stripe] No completed payment found for pi=${paymentIntentId}`,
    );
    return;
  }

  // Revert the audit to gated tier
  const { error } = await supabaseAdmin
    .from('audits')
    .update({
      tier_unlocked: 'gated',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.audit_id);

  if (error) {
    console.error('[stripe] Failed to revert audit tier:', error.message);
  }

  // Update payment status
  await supabaseAdmin
    .from('payments')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent', paymentIntentId);

  console.log(
    `[stripe] Charge refunded: audit=${payment.audit_id}, pi=${paymentIntentId}`,
  );
}
