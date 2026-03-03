// ---------------------------------------------------------------------------
// M-Pesa Daraja API Integration — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Initiates STK Push payments and processes callbacks from Safaricom's
// Daraja API. Supports both sandbox and production environments.
// ---------------------------------------------------------------------------

import axios, { type AxiosInstance } from 'axios';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DEFAULT_TENANT_ID } from '@/lib/tenant';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface STKPushParams {
  /** Phone number in international format (e.g. 254712345678). */
  phone: string;
  /** Amount in KES (integer). */
  amount: number;
  auditId: string;
  leadId: string;
}

export interface STKPushResult {
  checkoutRequestId: string;
}

interface DarajaAuthResponse {
  access_token: string;
  expires_in: string;
}

interface DarajaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface STKCallbackItem {
  Name: string;
  Value?: string | number;
}

interface STKCallbackBody {
  stkCallback: {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResultCode: number;
    ResultDesc: string;
    CallbackMetadata?: {
      Item: STKCallbackItem[];
    };
  };
}

interface DarajaSTKCallbackPayload {
  Body: STKCallbackBody;
}

// ---------------------------------------------------------------------------
// Constants & Config
// ---------------------------------------------------------------------------

const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
} as const;

type MpesaEnv = 'sandbox' | 'production';

function getConfig() {
  const env = (process.env.MPESA_ENV ?? 'sandbox') as MpesaEnv;

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!consumerKey) throw new Error('Missing env: MPESA_CONSUMER_KEY');
  if (!consumerSecret) throw new Error('Missing env: MPESA_CONSUMER_SECRET');
  if (!shortcode) throw new Error('Missing env: MPESA_SHORTCODE');
  if (!passkey) throw new Error('Missing env: MPESA_PASSKEY');
  if (!callbackUrl) throw new Error('Missing env: MPESA_CALLBACK_URL');

  return {
    env,
    baseUrl: BASE_URLS[env] ?? BASE_URLS.sandbox,
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    callbackUrl,
  };
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

let _httpClient: AxiosInstance | null = null;

function getHttpClient(): AxiosInstance {
  if (_httpClient) return _httpClient;

  const config = getConfig();
  _httpClient = axios.create({
    baseURL: config.baseUrl,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  return _httpClient;
}

// ---------------------------------------------------------------------------
// Auth: OAuth token generation
// ---------------------------------------------------------------------------

/** Cache the access token and its expiry time. */
let _cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Obtain an OAuth access token from the Daraja API.
 *
 * Tokens are cached in memory until they expire (with a 60-second safety margin).
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (_cachedToken && Date.now() < _cachedToken.expiresAt) {
    return _cachedToken.token;
  }

  const config = getConfig();
  const credentials = Buffer.from(
    `${config.consumerKey}:${config.consumerSecret}`,
  ).toString('base64');

  const http = getHttpClient();
  const response = await http.get<DarajaAuthResponse>(
    '/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );

  const token = response.data.access_token;
  const expiresInSeconds = parseInt(response.data.expires_in, 10) || 3599;

  // Cache with 60s safety margin
  _cachedToken = {
    token,
    expiresAt: Date.now() + (expiresInSeconds - 60) * 1000,
  };

  return token;
}

// ---------------------------------------------------------------------------
// STK Push helpers
// ---------------------------------------------------------------------------

/**
 * Generate the Daraja API password: base64(shortcode + passkey + timestamp).
 */
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

/**
 * Generate timestamp in the format YYYYMMDDHHmmss (East Africa Time).
 */
function generateTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

/**
 * Normalise phone number to 254XXXXXXXXX format.
 */
function normalisePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-().+]/g, '');

  // Convert leading 0 to 254
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '254' + cleaned.slice(1);
  }
  // Convert leading +254 to 254
  if (cleaned.startsWith('+254')) {
    cleaned = cleaned.slice(1);
  }
  // Validate basic structure
  if (!/^254\d{9}$/.test(cleaned)) {
    throw new Error(
      `Invalid phone number format: ${phone}. Expected 254XXXXXXXXX.`,
    );
  }

  return cleaned;
}

// ---------------------------------------------------------------------------
// Public API: STK Push
// ---------------------------------------------------------------------------

/**
 * Initiate an M-Pesa STK Push (Lipa Na M-Pesa Online) payment.
 *
 * Sends a push notification to the customer's phone prompting them to
 * enter their M-Pesa PIN. The result of the payment will be delivered
 * asynchronously via the callback URL.
 *
 * @param params - Phone, amount, and audit/lead IDs.
 * @returns The CheckoutRequestID for tracking the payment.
 */
export async function initiateSTKPush(
  params: STKPushParams,
): Promise<STKPushResult> {
  const config = getConfig();
  const token = await getAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(config.shortcode, config.passkey, timestamp);
  const phone = normalisePhone(params.phone);

  const http = getHttpClient();
  const response = await http.post<DarajaSTKPushResponse>(
    '/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(params.amount),
      PartyA: phone,
      PartyB: config.shortcode,
      PhoneNumber: phone,
      CallBackURL: config.callbackUrl,
      AccountReference: `SylvaPoint-${params.auditId.slice(0, 8)}`,
      TransactionDesc: `GTM Audit Playbook for audit ${params.auditId}`,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const data = response.data;

  if (data.ResponseCode !== '0') {
    throw new Error(
      `M-Pesa STK Push failed: ${data.ResponseDescription} (code ${data.ResponseCode})`,
    );
  }

  // Record the pending payment
  const { data: paymentRow } = await supabaseAdmin.from('payments').insert({
    tenant_id: DEFAULT_TENANT_ID,
    audit_id: params.auditId,
    lead_id: params.leadId,
    provider: 'mpesa',
    product_type: 'playbook_basic',
    mpesa_checkout_request_id: data.CheckoutRequestID,
    amount: Math.round(params.amount),
    currency: 'KES',
    status: 'pending',
  }).select('id').single();

  // Log M-Pesa-specific metadata in analytics
  await supabaseAdmin.from('analytics_events').insert({
    tenant_id: DEFAULT_TENANT_ID,
    event_type: 'mpesa_stk_push_initiated',
    audit_id: params.auditId,
    lead_id: params.leadId,
    properties: {
      checkout_request_id: data.CheckoutRequestID,
      merchant_request_id: data.MerchantRequestID,
      phone,
      payment_id: paymentRow?.id ?? null,
    },
  });

  return {
    checkoutRequestId: data.CheckoutRequestID,
  };
}

// ---------------------------------------------------------------------------
// Public API: Callback Handler
// ---------------------------------------------------------------------------

/**
 * Process an M-Pesa STK Push callback from Safaricom.
 *
 * Updates the payment record and, on success, unlocks the paid tier
 * for the associated audit.
 *
 * @param body - The raw callback body from Safaricom.
 */
export async function handleCallback(body: unknown): Promise<void> {
  const payload = body as DarajaSTKCallbackPayload;

  if (!payload?.Body?.stkCallback) {
    console.warn('[mpesa] Invalid callback body received');
    return;
  }

  const callback = payload.Body.stkCallback;
  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
    callback;

  console.log(
    `[mpesa] Callback received: checkout=${CheckoutRequestID}, ` +
      `result=${ResultCode}, desc=${ResultDesc}`,
  );

  // Look up the pending payment
  const { data: payment, error: lookupError } = await supabaseAdmin
    .from('payments')
    .select('id, audit_id, lead_id')
    .eq('mpesa_checkout_request_id', CheckoutRequestID)
    .single();

  if (lookupError || !payment) {
    console.error(
      `[mpesa] Payment not found for checkout=${CheckoutRequestID}:`,
      lookupError?.message ?? 'not found',
    );
    return;
  }

  if (ResultCode === 0) {
    // Payment successful
    const metadata = parseCallbackMetadata(CallbackMetadata?.Item ?? []);

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        mpesa_receipt_number: metadata.receiptNumber ?? null,
      })
      .eq('mpesa_checkout_request_id', CheckoutRequestID);

    // Unlock paid tier on the audit
    await supabaseAdmin
      .from('audits')
      .update({
        tier_unlocked: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.audit_id);

    // Log M-Pesa callback details in analytics
    await supabaseAdmin.from('analytics_events').insert({
      tenant_id: DEFAULT_TENANT_ID,
      event_type: 'mpesa_payment_completed',
      audit_id: payment.audit_id,
      lead_id: payment.lead_id,
      properties: {
        checkout_request_id: CheckoutRequestID,
        receipt_number: metadata.receiptNumber ?? null,
        transaction_date: metadata.transactionDate ?? null,
        phone: metadata.phoneNumber ?? null,
      },
    });

    console.log(
      `[mpesa] Payment completed: audit=${payment.audit_id}, receipt=${metadata.receiptNumber}`,
    );
  } else {
    // Payment failed or was cancelled
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
      })
      .eq('mpesa_checkout_request_id', CheckoutRequestID);

    // Log failure details in analytics
    await supabaseAdmin.from('analytics_events').insert({
      tenant_id: DEFAULT_TENANT_ID,
      event_type: 'mpesa_payment_failed',
      audit_id: payment.audit_id,
      lead_id: payment.lead_id,
      properties: {
        checkout_request_id: CheckoutRequestID,
        error_message: ResultDesc,
      },
    });

    console.warn(
      `[mpesa] Payment failed: audit=${payment.audit_id}, reason=${ResultDesc}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Callback metadata parser
// ---------------------------------------------------------------------------

function parseCallbackMetadata(items: STKCallbackItem[]): {
  amount?: number;
  receiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
} {
  const result: Record<string, string | number | undefined> = {};

  for (const item of items) {
    switch (item.Name) {
      case 'Amount':
        result.amount = typeof item.Value === 'number' ? item.Value : undefined;
        break;
      case 'MpesaReceiptNumber':
        result.receiptNumber = item.Value?.toString();
        break;
      case 'TransactionDate':
        result.transactionDate = item.Value?.toString();
        break;
      case 'PhoneNumber':
        result.phoneNumber = item.Value?.toString();
        break;
    }
  }

  return result as {
    amount?: number;
    receiptNumber?: string;
    transactionDate?: string;
    phoneNumber?: string;
  };
}
