// ---------------------------------------------------------------------------
// Claude API Wrapper — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Wraps the Anthropic SDK to provide a simple call interface with hard
// timeout enforcement, token usage tracking, and cost calculation.
// ---------------------------------------------------------------------------

import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClaudeModel =
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-6';

export interface ClaudeCallOptions {
  model?: ClaudeModel;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ClaudeResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  /** Estimated cost in USD. */
  cost: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MODEL: ClaudeModel = 'claude-haiku-4-5-20251001';
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.3;

/**
 * Hard timeout for any single Claude API call.
 * Must leave headroom within Vercel's 60s function limit:
 *   45s API + ~10s overhead (cold start, prompt build, DB) = ~55s < 60s.
 */
const HARD_TIMEOUT_MS = 45_000;

/**
 * Pricing per million tokens (USD). Updated to reflect current rates.
 *
 * Claude Haiku 4.5: $1 input / $5 output per MTok
 * Claude Sonnet 4.6: $3 input / $15 output per MTok
 */
const PRICING: Record<ClaudeModel, { inputPerMTok: number; outputPerMTok: number }> = {
  'claude-haiku-4-5-20251001': {
    inputPerMTok: 1.0,
    outputPerMTok: 5.0,
  },
  'claude-sonnet-4-6': {
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
  },
};

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing environment variable: ANTHROPIC_API_KEY. ' +
        'Add it to your .env.local file.',
    );
  }

  _client = new Anthropic({ apiKey });
  return _client;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate the estimated cost of a request based on token usage and model.
 */
function calculateCost(
  model: ClaudeModel,
  inputTokens: number,
  outputTokens: number,
): number {
  const rates = PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * rates.inputPerMTok;
  const outputCost = (outputTokens / 1_000_000) * rates.outputPerMTok;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

/**
 * Race a promise against a hard timeout. Returns the promise result or
 * throws a timeout error — guaranteed to resolve within `ms` milliseconds.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[claude] ${label} timed out after ${ms}ms`));
    }, ms);

    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Call the Claude API with the given options.
 *
 * Uses a hard Promise.race timeout to guarantee the call completes within
 * HARD_TIMEOUT_MS, regardless of SDK behavior. No client-level retries —
 * scorers handle failures with fallbacks, Inngest handles step retries.
 *
 * @param options - Model, prompts, and optional parameters.
 * @returns The response text, token usage, and estimated cost.
 */
export async function callClaude(
  options: ClaudeCallOptions,
): Promise<ClaudeResponse> {
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;

  const client = getClient();
  const startTime = Date.now();

  console.log(`[claude] Calling ${model} (maxTokens=${maxTokens}, timeout=${HARD_TIMEOUT_MS}ms)`);

  const apiCall = client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: options.systemPrompt,
    messages: [
      {
        role: 'user',
        content: options.userPrompt + '\n\nIMPORTANT: Respond with ONLY a valid JSON object. No markdown fences, no commentary, no trailing commas. Start with { and end with }.',
      },
    ],
  });

  const message = await withTimeout(apiCall, HARD_TIMEOUT_MS, model);

  // Extract text content from the response
  const content = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const elapsed = Date.now() - startTime;
  const inputTokens = message.usage.input_tokens;
  const outputTokens = message.usage.output_tokens;
  const cost = calculateCost(model, inputTokens, outputTokens);
  console.log(`[claude] ${model} responded in ${elapsed}ms (${inputTokens}in/${outputTokens}out, $${cost.toFixed(4)})`);

  return {
    content,
    usage: { inputTokens, outputTokens },
    cost,
  };
}
