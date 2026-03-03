// ---------------------------------------------------------------------------
// Firecrawl REST API Wrapper — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Calls the Firecrawl v1 REST API directly via fetch(). No SDK or MCP.
// Handles retries with exponential backoff, auto-detects priority pages,
// and returns a strongly-typed result.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrawledPage {
  url: string;
  title: string;
  markdown: string;
  html: string;
  metadata: Record<string, string>;
}

export interface FirecrawlResult {
  pages: CrawledPage[];
  pagesCount: number;
  /** Duration of the crawl in milliseconds. */
  duration: number;
}

interface FirecrawlCrawlResponse {
  success: boolean;
  id: string;
  url?: string;
}

interface FirecrawlStatusResponse {
  status: 'scraping' | 'completed' | 'failed' | 'cancelled';
  completed: number;
  total: number;
  data?: FirecrawlPageData[];
  error?: string;
}

interface FirecrawlPageData {
  url?: string;
  metadata?: Record<string, string> & { title?: string };
  markdown?: string;
  rawHtml?: string;
  html?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';

const MAX_PAGES = 6;
const MAX_DEPTH = 1;
const CRAWL_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;
const POLL_INTERVAL_MS = 2_000;

/** URL patterns to exclude from crawling. */
const EXCLUDE_PATTERNS = [
  '/blog/*',
  '/legal/*',
  '/careers/*',
  '*.pdf',
  '*.zip',
];

/** Priority page suffixes to include via allowBackwardLinks. */
const PRIORITY_SUFFIXES = [
  '/about',
  '/pricing',
  '/features',
  '/services',
  '/case-studies',
  '/contact',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) {
    throw new Error(
      'Missing environment variable: FIRECRAWL_API_KEY. ' +
        'Add it to your .env.local file.',
    );
  }
  return key;
}

/**
 * Build the list of "include" patterns so Firecrawl prioritises important
 * pages (e.g. /about, /pricing) that sit at depth 1 from the root.
 */
function buildIncludePatterns(baseUrl: string): string[] {
  try {
    const origin = new URL(baseUrl).origin;
    return PRIORITY_SUFFIXES.map((suffix) => `${origin}${suffix}*`);
  } catch {
    // If URL parsing fails, return suffix-only patterns.
    return PRIORITY_SUFFIXES.map((s) => `*${s}*`);
  }
}

/**
 * Sleep helper for retry back-off.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make a fetch request to the Firecrawl API with the Authorization header.
 */
async function firecrawlFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${FIRECRAWL_BASE_URL}${path}`;
  const apiKey = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Normalise a single Firecrawl page object into our CrawledPage shape.
 */
function normalisePage(raw: FirecrawlPageData): CrawledPage {
  return {
    url: raw.url ?? '',
    title: raw.metadata?.title ?? '',
    markdown: raw.markdown ?? '',
    html: raw.rawHtml ?? raw.html ?? '',
    metadata: Object.fromEntries(
      Object.entries(raw.metadata ?? {}).map(([k, v]) => [k, String(v)]),
    ),
  };
}

// ---------------------------------------------------------------------------
// Core: Start crawl, poll for results
// ---------------------------------------------------------------------------

/**
 * Kick off a crawl job via POST /v1/crawl and return the job ID.
 */
async function startCrawlJob(url: string): Promise<string> {
  const body = {
    url,
    limit: MAX_PAGES,
    maxDepth: MAX_DEPTH,
    excludePaths: EXCLUDE_PATTERNS,
    includePaths: buildIncludePatterns(url),
    scrapeOptions: {
      formats: ['markdown', 'rawHtml'],
      onlyMainContent: true,
      includeRawHtml: true,
    },
  };

  const response = await firecrawlFetch('/crawl', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Firecrawl crawl start failed (${response.status}): ${text}`,
    );
  }

  const data = (await response.json()) as FirecrawlCrawlResponse;
  if (!data.success || !data.id) {
    throw new Error('Firecrawl crawl start returned unexpected response');
  }

  return data.id;
}

/**
 * Poll GET /v1/crawl/:id until the crawl completes, fails, or times out.
 */
async function pollCrawlResult(
  jobId: string,
  timeoutMs: number,
): Promise<FirecrawlPageData[]> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await firecrawlFetch(`/crawl/${jobId}`);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Firecrawl poll failed (${response.status}): ${text}`,
      );
    }

    const data = (await response.json()) as FirecrawlStatusResponse;

    if (data.status === 'completed') {
      return data.data ?? [];
    }

    if (data.status === 'failed' || data.status === 'cancelled') {
      throw new Error(
        `Firecrawl crawl ${data.status}: ${data.error ?? 'unknown error'}`,
      );
    }

    // Still scraping — wait then poll again.
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(POLL_INTERVAL_MS, remaining));
  }

  throw new Error(
    `Firecrawl crawl timed out after ${timeoutMs}ms (job ${jobId})`,
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Crawl a website using the Firecrawl REST API.
 *
 * Automatically retries on transient failures (up to MAX_RETRIES times) with
 * exponential backoff (1s, 2s).
 *
 * @param url - The root URL to crawl.
 * @returns Structured crawl result with pages, count, and duration.
 */
export async function crawlWebsite(url: string): Promise<FirecrawlResult> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const startTime = Date.now();

      // 1. Start the crawl job
      const jobId = await startCrawlJob(url);

      // 2. Poll until complete (or timeout)
      const rawPages = await pollCrawlResult(jobId, CRAWL_TIMEOUT_MS);

      // 3. Normalise results
      const pages = rawPages.map(normalisePage);
      const duration = Date.now() - startTime;

      return {
        pages,
        pagesCount: pages.length,
        duration,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt.
      if (attempt < MAX_RETRIES) {
        const backoffMs = 1000 * Math.pow(2, attempt); // 1s, 2s
        console.warn(
          `[firecrawl] Attempt ${attempt + 1} failed, retrying in ${backoffMs}ms: ${lastError.message}`,
        );
        await sleep(backoffMs);
      }
    }
  }

  throw new Error(
    `Firecrawl crawl failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
  );
}
