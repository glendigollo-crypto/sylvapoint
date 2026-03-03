// ---------------------------------------------------------------------------
// Google PageSpeed Insights API Wrapper — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Calls the Google PageSpeed Insights API v5 to retrieve Lighthouse scores
// for a given URL. Uses mobile strategy by default. The API is free for basic
// usage (no key required), but an optional API key can be provided.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageSpeedResult {
  /** Performance score 0–100. */
  performance: number;
  /** Accessibility score 0–100. */
  accessibility: number;
  /** SEO score 0–100. */
  seo: number;
  /** Best practices score 0–100. */
  bestPractices: number;
  /** Selected audit items keyed by audit ID. */
  audits: Record<string, PageSpeedAudit>;
}

export interface PageSpeedAudit {
  score: number | null;
  title: string;
  description: string;
}

interface PSICategory {
  score: number | null;
}

interface PSIAuditItem {
  id: string;
  score: number | null;
  title?: string;
  description?: string;
}

interface PSIResponse {
  lighthouseResult?: {
    categories?: {
      performance?: PSICategory;
      accessibility?: PSICategory;
      seo?: PSICategory;
      'best-practices'?: PSICategory;
    };
    audits?: Record<string, PSIAuditItem>;
  };
  error?: {
    message?: string;
    code?: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PSI_BASE_URL =
  'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const REQUEST_TIMEOUT_MS = 60_000;

/** Audit IDs we want to extract from the Lighthouse results. */
const TRACKED_AUDITS = [
  'viewport',
  'meta-description',
  'is-crawlable',
  'structured-data',
  'document-title',
  'http-status-code',
  'font-size',
  'link-text',
  'robots-txt',
  'image-alt',
  'tap-targets',
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'speed-index',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a Lighthouse category score (0–1) to a 0–100 integer.
 * Returns 0 if the score is null or undefined.
 */
function toScore100(score: number | null | undefined): number {
  if (score == null) return 0;
  return Math.round(score * 100);
}

/**
 * Build the PageSpeed Insights request URL.
 */
function buildUrl(targetUrl: string): string {
  const params = new URLSearchParams({
    url: targetUrl,
    strategy: 'mobile',
    category: 'performance',
  });

  // The API accepts multiple `category` params.
  params.append('category', 'accessibility');
  params.append('category', 'seo');
  params.append('category', 'best-practices');

  // Add API key if available (raises quota limits).
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (apiKey) {
    params.set('key', apiKey);
  }

  return `${PSI_BASE_URL}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch PageSpeed Insights (Lighthouse) scores for a URL.
 *
 * Uses mobile strategy and requests performance, accessibility, SEO, and
 * best-practices categories. Returns null scores gracefully on timeout or
 * API failure rather than throwing.
 *
 * @param url - The page URL to analyse.
 * @returns PageSpeedResult with scores scaled to 0–100 and selected audits, or null on failure.
 */
export async function getPageSpeedScores(
  url: string,
): Promise<PageSpeedResult | null> {

  try {
    const requestUrl = buildUrl(url);
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    console.log(`[pagespeed] Fetching scores for ${url} (key: ${apiKey ? 'yes' : 'no'}, timeout: ${REQUEST_TIMEOUT_MS}ms)`);

    // Fetch with retry on 429
    let data: PSIResponse | null = null;
    const maxAttempts = apiKey ? 2 : 1; // Only retry if we have an API key

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      let response: Response;
      try {
        response = await fetch(requestUrl, {
          method: 'GET',
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status === 429 && attempt < maxAttempts) {
        console.warn(`[pagespeed] Rate limited (429), retrying in 5s... (attempt ${attempt}/${maxAttempts})`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.warn(
          `[pagespeed] API returned status ${response.status} for ${url}: ${body.slice(0, 200)}`,
        );
        return null;
      }

      data = (await response.json()) as PSIResponse;
      break;
    }

    if (!data) {
      console.warn(`[pagespeed] All attempts failed for ${url}`);
      return null;
    }

    // Handle API-level errors
    if (data.error) {
      console.warn(
        `[pagespeed] API error for ${url}: ${data.error.message ?? 'unknown'}`,
      );
      return null;
    }

    const categories = data.lighthouseResult?.categories;
    const rawAudits = data.lighthouseResult?.audits;

    // Extract category scores
    const performance = toScore100(categories?.performance?.score);
    const accessibility = toScore100(categories?.accessibility?.score);
    const seo = toScore100(categories?.seo?.score);
    const bestPractices = toScore100(categories?.['best-practices']?.score);

    // Extract tracked audit items
    const audits: Record<string, PageSpeedAudit> = {};
    if (rawAudits) {
      for (const auditId of TRACKED_AUDITS) {
        const audit = rawAudits[auditId];
        if (audit) {
          audits[auditId] = {
            score: audit.score,
            title: audit.title ?? auditId,
            description: audit.description ?? '',
          };
        }
      }
    }

    console.log(`[pagespeed] Scores for ${url}: perf=${performance}, a11y=${accessibility}, seo=${seo}, bp=${bestPractices}, audits=${Object.keys(audits).length}`);

    return {
      performance,
      accessibility,
      seo,
      bestPractices,
      audits,
    };
  } catch (error) {
    // Graceful fallback on any failure (timeout, network error, parse error).
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn(`[pagespeed] Request timed out after ${REQUEST_TIMEOUT_MS}ms for ${url}`);
    } else {
      console.warn(
        `[pagespeed] Failed to fetch scores for ${url}:`,
        error instanceof Error ? error.message : error,
      );
    }
    return null;
  }
}
