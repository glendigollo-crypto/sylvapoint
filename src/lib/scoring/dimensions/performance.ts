// ---------------------------------------------------------------------------
// Website Performance Scorer — SylvaPoint GTM Audit Tool
// Uses PageSpeed / Lighthouse data directly (no LLM required)
// ---------------------------------------------------------------------------

import type { ScorerInput, DimensionScorerResult, PageSpeedResult } from '../types';

/**
 * Sub-score definitions for the Performance dimension.
 * These map directly to Core Web Vitals and overall Lighthouse score.
 */
const SUB_SCORE_DEFINITIONS = [
  { key: 'lcp', label: 'Largest Contentful Paint (LCP)' },
  { key: 'fid', label: 'First Input Delay / INP' },
  { key: 'cls', label: 'Cumulative Layout Shift (CLS)' },
  { key: 'overall_performance', label: 'Overall Performance Score' },
] as const;

// ---------------------------------------------------------------------------
// Thresholds for interpreting Lighthouse scores (0-1 scale)
// ---------------------------------------------------------------------------

interface ThresholdRange {
  good: number;
  moderate: number;
}

const THRESHOLDS: Record<string, ThresholdRange> = {
  lcp: { good: 0.9, moderate: 0.5 },
  fid: { good: 0.9, moderate: 0.5 },
  cls: { good: 0.9, moderate: 0.5 },
  overall_performance: { good: 0.9, moderate: 0.5 },
};

/**
 * Convert a Lighthouse 0-1 score to our 0-100 scale with contextual mapping.
 * Lighthouse scores below 0.5 are "poor", 0.5-0.89 are "needs improvement",
 * 0.9+ are "good".
 */
function lighthouseToScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value * 100)));
}

/**
 * Get a severity rating from a Lighthouse score.
 */
function getSeverity(score: number): 'critical' | 'warning' | 'info' {
  if (score < 50) return 'critical';
  if (score < 90) return 'warning';
  return 'info';
}

/**
 * Extract a specific audit score from PageSpeed audits, with fallback.
 */
function getAuditScore(
  pagespeed: PageSpeedResult,
  auditKey: string,
  fallback: number
): number {
  const audit = pagespeed.audits[auditKey];
  return audit && audit.score != null ? audit.score * 100 : fallback;
}

/**
 * Score the Website Performance dimension.
 *
 * Unlike other dimensions, this scorer does NOT require an LLM call.
 * It maps directly from PageSpeed Insights / Lighthouse audit data.
 * If no PageSpeed data is available, returns conservative placeholder scores.
 *
 * @param input - Crawl extraction data, audit metadata, and optional PageSpeed results
 * @returns Dimension scorer result with sub-scores, findings, and quick wins
 */
export async function scorePerformance(
  input: ScorerInput
): Promise<DimensionScorerResult> {
  const { pagespeed } = input;

  // If no PageSpeed data, return placeholder with low confidence
  if (!pagespeed) {
    return buildNoDataResult();
  }

  // Map PageSpeed data to sub-scores
  const lcpScore = getAuditScore(pagespeed, 'largest-contentful-paint', pagespeed.performance * 100);
  const fidScore = getAuditScore(pagespeed, 'max-potential-fid', pagespeed.performance * 100);
  const clsScore = getAuditScore(pagespeed, 'cumulative-layout-shift', pagespeed.performance * 100);
  const overallScore = lighthouseToScore(pagespeed.performance);

  const scoreMap: Record<string, number> = {
    lcp: lcpScore,
    fid: fidScore,
    cls: clsScore,
    overall_performance: overallScore,
  };

  const sub_scores = SUB_SCORE_DEFINITIONS.map(({ key, label }) => ({
    key,
    label,
    score: Math.round(scoreMap[key] ?? 50),
    weight: key === 'lcp' ? 0.30 : key === 'fid' ? 0.25 : key === 'cls' ? 0.25 : 0.20,
    evidence: buildEvidenceText(key, scoreMap[key] ?? 50, pagespeed),
    evidence_quotes: [],
  }));

  const raw_score =
    sub_scores.reduce((sum, s) => sum + s.score * s.weight, 0);

  // Build findings based on actual performance data
  const findings: DimensionScorerResult['findings'] = [];

  if (overallScore < 50) {
    findings.push({
      title: 'Critical performance issues detected',
      severity: 'critical',
      evidence: `Lighthouse performance score: ${overallScore}/100. This is in the "poor" range and significantly impacts user experience and SEO.`,
      recommendation:
        'Prioritize performance optimization: compress images, eliminate render-blocking resources, and reduce JavaScript bundle size.',
      playbook_chapter: 'performance-critical-fixes',
    });
  }

  if (lcpScore < 50) {
    findings.push({
      title: 'Slow Largest Contentful Paint (LCP)',
      severity: 'critical',
      evidence: `LCP score: ${Math.round(lcpScore)}/100. The main content takes too long to render, causing visitors to abandon the page.`,
      recommendation:
        'Optimize hero images (use WebP/AVIF, proper sizing), preload critical resources, and reduce server response time.',
    });
  } else if (lcpScore < 90) {
    findings.push({
      title: 'LCP could be improved',
      severity: 'warning',
      evidence: `LCP score: ${Math.round(lcpScore)}/100. There is room for improvement in content loading speed.`,
      recommendation:
        'Consider lazy-loading below-fold images, implementing a CDN, and optimizing critical rendering path.',
    });
  }

  if (clsScore < 50) {
    findings.push({
      title: 'High Cumulative Layout Shift',
      severity: 'critical',
      evidence: `CLS score: ${Math.round(clsScore)}/100. Page elements shift after loading, creating a frustrating user experience.`,
      recommendation:
        'Set explicit width/height on images and embeds, avoid inserting content above existing content, and use CSS containment.',
    });
  }

  if (pagespeed.accessibility < 0.9) {
    findings.push({
      title: 'Accessibility improvements needed',
      severity: getSeverity(pagespeed.accessibility * 100),
      evidence: `Lighthouse accessibility score: ${Math.round(pagespeed.accessibility * 100)}/100.`,
      recommendation:
        'Review color contrast ratios, add alt text to images, ensure proper ARIA labels, and test with a screen reader.',
    });
  }

  // Build quick wins
  const quick_wins: DimensionScorerResult['quick_wins'] = [];

  if (overallScore < 90) {
    quick_wins.push({
      title: 'Compress and optimize images',
      description:
        'Convert images to WebP/AVIF format, resize to display dimensions, and implement lazy loading for below-fold images.',
      impact: overallScore < 50 ? 'high' : 'medium',
      effort: 'moderate',
    });
  }

  if (lcpScore < 90) {
    quick_wins.push({
      title: 'Preload critical resources',
      description:
        'Add <link rel="preload"> for your hero image and critical fonts to speed up initial render.',
      impact: 'high',
      effort: 'quick',
    });
  }

  if (clsScore < 90) {
    quick_wins.push({
      title: 'Reserve space for dynamic content',
      description:
        'Add explicit width and height attributes to all images and video embeds to prevent layout shifts.',
      impact: 'medium',
      effort: 'quick',
    });
  }

  quick_wins.push({
    title: 'Enable text compression',
    description:
      'Ensure your server sends Gzip or Brotli compressed responses for all text-based assets (HTML, CSS, JS).',
    impact: 'medium',
    effort: 'quick',
  });

  return {
    dimension_key: 'performance',
    label: 'Website Performance',
    raw_score: Math.round(raw_score * 100) / 100,
    sub_scores,
    summary_free: `Lighthouse performance score: ${overallScore}/100. ${
      overallScore >= 90
        ? 'Excellent performance — your site loads quickly and provides a smooth experience.'
        : overallScore >= 50
          ? 'Moderate performance — there are opportunities to improve loading speed and user experience.'
          : 'Performance needs significant improvement — slow loading is likely costing you visitors and conversions.'
    }`,
    summary_gated: `[Detailed performance breakdown including specific resource optimization recommendations, render-blocking analysis, and prioritized fix list will be available after email capture.]`,
    findings,
    quick_wins,
  };
}

// ---------------------------------------------------------------------------
// Helper: Build evidence text for a sub-score
// ---------------------------------------------------------------------------

function buildEvidenceText(
  key: string,
  score: number,
  pagespeed: PageSpeedResult
): string {
  const rounded = Math.round(score);
  const threshold = THRESHOLDS[key];

  if (!threshold) return `Score: ${rounded}/100`;

  const status =
    score >= threshold.good * 100
      ? 'Good'
      : score >= threshold.moderate * 100
        ? 'Needs Improvement'
        : 'Poor';

  switch (key) {
    case 'lcp':
      return `Largest Contentful Paint score: ${rounded}/100 (${status}). Target: 2.5s or faster.`;
    case 'fid':
      return `First Input Delay / INP score: ${rounded}/100 (${status}). Target: 100ms or faster.`;
    case 'cls':
      return `Cumulative Layout Shift score: ${rounded}/100 (${status}). Target: 0.1 or lower.`;
    case 'overall_performance':
      return `Lighthouse performance: ${rounded}/100 (${status}). Accessibility: ${Math.round(pagespeed.accessibility * 100)}/100, SEO: ${Math.round(pagespeed.seo * 100)}/100.`;
    default:
      return `Score: ${rounded}/100 (${status}).`;
  }
}

// ---------------------------------------------------------------------------
// Helper: Build result when no PageSpeed data is available
// ---------------------------------------------------------------------------

function buildNoDataResult(): DimensionScorerResult {
  const sub_scores = SUB_SCORE_DEFINITIONS.map(({ key, label }) => ({
    key,
    label,
    score: 50,
    weight: key === 'lcp' ? 0.30 : key === 'fid' ? 0.25 : key === 'cls' ? 0.25 : 0.20,
    evidence: `[No PageSpeed data available] Unable to measure ${label}. Score set to neutral 50/100 pending data collection.`,
    evidence_quotes: [],
  }));

  return {
    dimension_key: 'performance',
    label: 'Website Performance',
    raw_score: 50,
    sub_scores,
    summary_free:
      'PageSpeed data was not available for this audit. Performance scores are set to a neutral baseline and will be updated when Lighthouse data is collected.',
    summary_gated:
      '[Performance analysis requires PageSpeed Insights data. Re-run the audit to collect performance metrics.]',
    findings: [
      {
        title: 'PageSpeed data unavailable',
        severity: 'info',
        evidence:
          'No Lighthouse / PageSpeed Insights data was provided for this audit run.',
        recommendation:
          'Ensure the PageSpeed API key is configured and the target URL is publicly accessible.',
      },
    ],
    quick_wins: [
      {
        title: 'Run a Lighthouse audit',
        description:
          'Use Google PageSpeed Insights or Chrome DevTools Lighthouse to get baseline performance metrics.',
        impact: 'high',
        effort: 'quick',
      },
    ],
  };
}
