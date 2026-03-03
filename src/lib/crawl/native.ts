// ---------------------------------------------------------------------------
// Native Fetch Crawler — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Lightweight fallback crawler using Node.js fetch(). Used when Firecrawl
// is unavailable or rate-limited. Fetches the homepage and up to 5 linked
// priority pages, extracts HTML and basic text content.
// ---------------------------------------------------------------------------

import type { CrawledPage, FirecrawlResult } from './firecrawl';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PAGES = 6;
const FETCH_TIMEOUT_MS = 10_000;
const PRIORITY_PATHS = ['/about', '/pricing', '/features', '/services', '/contact', '/case-studies'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, ' ').trim() : '';
}

function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const regex = /<meta\s+(?:[^>]*?\s)?(?:name|property)=["']([^"']+)["'][^>]*?\scontent=["']([^"']+)["'][^>]*?>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    meta[match[1]] = match[2];
  }
  // Also match content before name/property
  const regex2 = /<meta\s+content=["']([^"']+)["'][^>]*?\s(?:name|property)=["']([^"']+)["'][^>]*?>/gi;
  while ((match = regex2.exec(html)) !== null) {
    meta[match[2]] = match[1];
  }
  return meta;
}

function htmlToBasicMarkdown(html: string): string {
  return html
    // Remove script/style blocks
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    // Convert headings
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n')
    // Convert paragraphs and line breaks
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert links
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    // Convert lists
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    // Convert emphasis
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    // Strip remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Clean up whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  const links = new Set<string>();
  const regex = /href=["']([^"'#]+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const resolved = new URL(match[1], baseUrl).href;
      if (resolved.startsWith(origin) && !resolved.match(/\.(pdf|zip|png|jpg|gif|svg|css|js)$/i)) {
        links.add(resolved);
      }
    } catch {
      // Skip invalid URLs
    }
  }
  return [...links];
}

async function fetchPage(url: string): Promise<{ html: string; ok: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SylvaPointBot/1.0; +https://sylvapoint.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { html: '', ok: false };
    }

    const html = await response.text();
    return { html, ok: true };
  } catch {
    return { html: '', ok: false };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Crawl a website using native fetch. Fetches the homepage first, then
 * attempts priority pages (/about, /pricing, etc.).
 *
 * Returns the same FirecrawlResult shape so it's a drop-in fallback.
 */
export async function nativeCrawl(url: string): Promise<FirecrawlResult> {
  const startTime = Date.now();
  const pages: CrawledPage[] = [];
  const visited = new Set<string>();

  // Normalise base URL
  const parsedUrl = new URL(url);
  const baseUrl = parsedUrl.origin;
  const homepage = parsedUrl.href;

  // 1. Fetch homepage
  const { html: homeHtml, ok: homeOk } = await fetchPage(homepage);
  if (!homeOk || !homeHtml) {
    throw new Error(`Native crawl: failed to fetch homepage at ${homepage}`);
  }

  visited.add(homepage);
  pages.push({
    url: homepage,
    title: extractTitle(homeHtml),
    markdown: htmlToBasicMarkdown(homeHtml),
    html: homeHtml,
    metadata: { ...extractMetaTags(homeHtml), title: extractTitle(homeHtml) },
  });

  // 2. Discover priority pages
  const internalLinks = extractInternalLinks(homeHtml, homepage);
  const priorityUrls: string[] = [];

  for (const path of PRIORITY_PATHS) {
    const candidate = `${baseUrl}${path}`;
    // Check exact match or with trailing slash
    const found = internalLinks.find(
      (link) => link === candidate || link === `${candidate}/` || link.startsWith(`${candidate}?`)
    );
    if (found && !visited.has(found)) {
      priorityUrls.push(found);
    }
  }

  // 3. Fetch priority pages in parallel (up to MAX_PAGES - 1)
  const toFetch = priorityUrls.slice(0, MAX_PAGES - 1);
  const results = await Promise.allSettled(toFetch.map((u) => fetchPage(u)));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const pageUrl = toFetch[i];
    if (result.status === 'fulfilled' && result.value.ok && result.value.html) {
      visited.add(pageUrl);
      pages.push({
        url: pageUrl,
        title: extractTitle(result.value.html),
        markdown: htmlToBasicMarkdown(result.value.html),
        html: result.value.html,
        metadata: { ...extractMetaTags(result.value.html), title: extractTitle(result.value.html) },
      });
    }
  }

  const duration = Date.now() - startTime;

  console.log(
    `[native-crawl] Crawled ${pages.length} pages from ${baseUrl} in ${duration}ms`,
  );

  return {
    pages,
    pagesCount: pages.length,
    duration,
  };
}
