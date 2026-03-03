// ---------------------------------------------------------------------------
// Claude API Wrapper — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Wraps the Anthropic SDK to provide a simple call interface with retry
// logic, token usage tracking, and cost calculation.
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
const MAX_RETRIES = 2;

/**
 * Pricing per million tokens (USD). Updated to reflect current rates.
 *
 * Claude Haiku 4.5: $1 input / $5 output per MTok
 * Claude Sonnet 4.5: $3 input / $15 output per MTok
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  // Round to 6 decimal places to avoid floating-point noise
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

/**
 * Determine whether an error is retryable (transient server / rate-limit).
 */
function isRetryable(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    // Retry on rate limits (429), server errors (500+), and overloaded (529)
    return (
      error.status === 429 ||
      error.status === 529 ||
      (error.status >= 500 && error.status < 600)
    );
  }

  // Retry on generic network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Call the Claude API with the given options.
 *
 * Retries up to MAX_RETRIES times on transient failures with exponential
 * backoff. Non-retryable errors are thrown immediately.
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
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
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

      // Extract text content from the response
      const content = message.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      const inputTokens = message.usage.input_tokens;
      const outputTokens = message.usage.output_tokens;
      const cost = calculateCost(model, inputTokens, outputTokens);

      return {
        content,
        usage: { inputTokens, outputTokens },
        cost,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Only retry on transient errors
      if (!isRetryable(error) || attempt >= MAX_RETRIES) {
        break;
      }

      const backoffMs = 1000 * Math.pow(2, attempt); // 1s, 2s
      console.warn(
        `[claude] Attempt ${attempt + 1} failed (${lastError.message}), retrying in ${backoffMs}ms`,
      );
      await sleep(backoffMs);
    }
  }

  throw new Error(
    `Claude API call failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
  );
}
