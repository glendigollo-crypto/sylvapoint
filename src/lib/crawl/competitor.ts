// ---------------------------------------------------------------------------
// Lightweight Competitor Analyzer — SylvaPoint GTM Audit Tool
// Fetches competitor homepage with native fetch + parses with cheerio.
// Returns a compact CompetitorSnapshot (~5KB) at zero marginal API cost.
// Entire function is wrapped in try-catch — returns null on any failure.
// ---------------------------------------------------------------------------

import * as cheerio from 'cheerio';
import { getPageSpeedScores } from '@/lib/lighthouse/pagespeed';
import type { CompetitorSnapshot } from '@/lib/scoring/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 10_000;

/** Patterns that suggest a CTA (button or link with action text). */
const CTA_PATTERNS =
  /\b(get started|sign up|start free|try|buy|subscribe|book|schedule|contact|request|demo|download|join|register|learn more|start now|free trial)\b/i;

/** Patterns that suggest testimonial/social-proof sections. */
const TESTIMONIAL_PATTERNS =
  /\b(testimonial|review|customer stor|what .* say|case stud|success stor|trusted by|used by)\b/i;

/** Patterns that suggest pricing content. */
const PRICING_PATTERNS =
  /\b(pricing|plans?|per month|\/mo|\/year|free tier|enterprise plan|starter|professional|premium)\b/i;

// ---------------------------------------------------------------------------
// Simple tech stack detection via HTML patterns + meta tags
// ---------------------------------------------------------------------------

function detectTechStack(html: string, headers: Headers): string[] {
  const techs: string[] = [];
  const lower = html.toLowerCase();

  // Frameworks / libraries
  if (lower.includes('__next') || lower.includes('_next/static')) techs.push('Next.js');
  else if (lower.includes('react') || lower.includes('reactdom')) techs.push('React');
  if (lower.includes('__nuxt') || lower.includes('nuxt')) techs.push('Nuxt');
  else if (lower.includes('vue') && !techs.includes('Nuxt')) techs.push('Vue.js');
  if (lower.includes('ng-') || lower.includes('angular')) techs.push('Angular');
  if (lower.includes('svelte')) techs.push('Svelte');
  if (lower.includes('gatsby')) techs.push('Gatsby');
  if (lower.includes('astro')) techs.push('Astro');

  // CMS / platforms
  if (lower.includes('wp-content') || lower.includes('wordpress')) techs.push('WordPress');
  if (lower.includes('shopify') || lower.includes('cdn.shopify')) techs.push('Shopify');
  if (lower.includes('squarespace')) techs.push('Squarespace');
  if (lower.includes('wix.com') || lower.includes('wixsite')) techs.push('Wix');
  if (lower.includes('webflow')) techs.push('Webflow');
  if (lower.includes('hubspot')) techs.push('HubSpot');
  if (lower.includes('framer.com') || lower.includes('framerusercontent')) techs.push('Framer');

  // Analytics / tracking
  if (lower.includes('gtag') || lower.includes('google-analytics') || lower.includes('googletagmanager')) techs.push('Google Analytics');
  if (lower.includes('hotjar')) techs.push('Hotjar');
  if (lower.includes('segment.com') || lower.includes('segment.io')) techs.push('Segment');
  if (lower.includes('intercom')) techs.push('Intercom');
  if (lower.includes('drift')) techs.push('Drift');
  if (lower.includes('crisp')) techs.push('Crisp');
  if (lower.includes('mixpanel')) techs.push('Mixpanel');

  // Server headers
  const server = headers.get('x-powered-by') || headers.get('server') || '';
  if (/vercel/i.test(server)) techs.push('Vercel');
  if (/netlify/i.test(server)) techs.push('Netlify');
  if (/cloudflare/i.test(server)) techs.push('Cloudflare');
  if (/nginx/i.test(server)) techs.push('Nginx');
  if (/apache/i.test(server)) techs.push('Apache');

  return [...new Set(techs)];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a competitor's homepage and return a compact snapshot.
 * Returns null on any failure — the audit continues without competitor data.
 */
export async function analyzeCompetitor(
  url: string,
): Promise<CompetitorSnapshot | null> {
  try {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Fetch homepage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; SylvaPointBot/1.0; +https://sylvapoint.com)',
          Accept: 'text/html',
        },
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.warn(
        `[competitor] HTTP ${response.status} for ${normalizedUrl}`,
      );
      return null;
    }

    const html = await response.text();
    if (!html || html.length < 100) {
      console.warn(`[competitor] Empty or tiny response from ${normalizedUrl}`);
      return null;
    }

    // Parse with cheerio
    const $ = cheerio.load(html);

    // Headlines (H1-H3)
    const headlines: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2 && text.length < 300) {
        headlines.push(text);
      }
    });

    // CTA count — buttons and links with action text
    let ctaCount = 0;
    $('a, button').each((_, el) => {
      const text = $(el).text().trim();
      if (CTA_PATTERNS.test(text)) ctaCount++;
    });

    // Forms
    const formCount = $('form').length;

    // Images
    const imageCount = $('img').length;

    // Video detection
    const hasVideo =
      $('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wistia"], iframe[src*="loom"]')
        .length > 0;

    // Testimonials detection
    const bodyText = $('body').text();
    const hasTestimonials =
      TESTIMONIAL_PATTERNS.test(bodyText) ||
      $('[class*="testimonial"], [class*="review"], [class*="customer"], [data-testimonial]')
        .length > 0;

    // Pricing detection
    const hasPricing =
      PRICING_PATTERNS.test(bodyText) ||
      $('[class*="pricing"], [class*="plans"], [href*="pricing"]').length > 0;

    // Meta tags
    const metaTitle = $('title').first().text().trim() || '';
    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() || '';

    // Tech stack detection
    const techStack = detectTechStack(html, response.headers);

    // PageSpeed score (run in parallel — non-blocking, with its own timeout)
    let pagespeedScore: number | undefined;
    try {
      const psi = await getPageSpeedScores(normalizedUrl);
      pagespeedScore = psi?.performance || undefined;
    } catch {
      // PageSpeed failure is non-critical
    }

    return {
      url: normalizedUrl,
      headlines: headlines.slice(0, 15), // Cap at 15 to keep snapshot compact
      ctaCount,
      formCount,
      imageCount,
      hasVideo,
      hasTestimonials,
      hasPricing,
      techStack,
      metaTitle: metaTitle.slice(0, 200),
      metaDescription: metaDescription.slice(0, 300),
      pagespeedScore,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn(`[competitor] Fetch timed out after ${FETCH_TIMEOUT_MS}ms for ${url}`);
    } else {
      console.warn(
        `[competitor] Analysis failed for ${url}:`,
        error instanceof Error ? error.message : error,
      );
    }
    return null;
  }
}
