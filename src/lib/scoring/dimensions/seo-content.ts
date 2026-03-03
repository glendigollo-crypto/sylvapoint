// ---------------------------------------------------------------------------
// SEO & Content Quality Scorer — SylvaPoint GTM Audit Tool
// Phase 2: Uses Claude Haiku API for SEO and content analysis
// ---------------------------------------------------------------------------

import type { ScorerInput, DimensionScorerResult } from '../types';
import { callClaude } from '@/lib/claude/client';
import {
  SEO_SYSTEM_PROMPT,
  SEO_USER_PROMPT,
} from '@/lib/claude/prompts/seo-content';

// ---------------------------------------------------------------------------
// Sub-score metadata (matches the prompt's 5 sub-dimensions)
// ---------------------------------------------------------------------------

const SUB_SCORE_META: Record<string, { label: string; weight: number }> = {
  technical_seo:     { label: 'Technical SEO',     weight: 0.25 },
  readability:       { label: 'Readability',       weight: 0.20 },
  eeat_signals:      { label: 'E-E-A-T Signals',  weight: 0.20 },
  content_depth:     { label: 'Content Depth',     weight: 0.20 },
  content_freshness: { label: 'Content Freshness', weight: 0.15 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a body-content string from the extraction data to feed the prompt.
 */
function buildBodyContent(extraction: ScorerInput['extraction']): string {
  const parts: string[] = [];

  for (const h of extraction.headlines) {
    parts.push(h.text);
  }
  for (const cta of extraction.ctas) {
    parts.push(cta);
  }
  for (const t of extraction.testimonials) {
    const attribution = [t.author, t.role, t.company].filter(Boolean).join(', ');
    parts.push(`"${t.text}" — ${attribution || 'Anonymous'}`);
  }
  for (const faq of extraction.faq) {
    parts.push(`Q: ${faq.question}\nA: ${faq.answer}`);
  }
  for (const p of extraction.proof) {
    parts.push(p.text);
  }

  return parts.join('\n\n');
}

/**
 * Build headline structure lines (e.g. "H1: Main Heading").
 */
function buildHeadlineStructure(extraction: ScorerInput['extraction']): string[] {
  return extraction.headlines.map((h) => `H${h.level}: ${h.text}`);
}

/**
 * Determine if structured data is likely present based on proof items.
 * (Heuristic: presence of certification, badge, or stat proof items suggests schema.)
 */
function inferStructuredData(extraction: ScorerInput['extraction']): boolean {
  return extraction.proof.some(
    (p) => p.type === 'certification' || p.type === 'badge',
  );
}

/**
 * Extract JSON from a Claude response string, handling potential markdown fences.
 */
function extractJson(raw: string): unknown {
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = fenceMatch ? fenceMatch[1] : raw;
  return JSON.parse(jsonStr.trim());
}

// ---------------------------------------------------------------------------
// Fallback result when the Claude call fails
// ---------------------------------------------------------------------------

function buildFallbackResult(input: ScorerInput, error: unknown): DimensionScorerResult {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.error('[seo-content scorer] Claude call failed, using fallback:', errMsg);

  const sub_scores = Object.entries(SUB_SCORE_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    score: 50,
    weight: meta.weight,
    evidence: `[Fallback] Unable to complete AI analysis: ${errMsg}`,
    evidence_quotes: [] as string[],
  }));

  return {
    dimension_key: 'seo',
    label: 'SEO & Content Quality',
    raw_score: 50,
    sub_scores,
    summary_free:
      'SEO & content quality analysis could not be completed at this time. Scores are set to a neutral baseline.',
    summary_gated:
      '[Detailed SEO analysis was unavailable. Please retry the audit.]',
    findings: [
      {
        title: 'SEO analysis incomplete',
        severity: 'info',
        evidence: `AI analysis failed: ${errMsg}`,
        recommendation:
          'Re-run the audit to get a full SEO and content quality evaluation.',
      },
    ],
    quick_wins: [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score the SEO & Content Quality dimension using Claude Haiku.
 *
 * Combines PageSpeed SEO score with Claude analysis of content quality,
 * readability, E-E-A-T signals, and content depth.
 *
 * @param input - Crawl extraction data and audit metadata
 * @returns Dimension scorer result with sub-scores, findings, and quick wins
 */
export async function scoreSeoContent(
  input: ScorerInput,
): Promise<DimensionScorerResult> {
  const { extraction, business_type, pagespeed } = input;

  // ---- Build prompt context ----
  const technicalSeoScore = pagespeed
    ? Math.round(pagespeed.seo * 100)
    : 50;

  const bodyContent = buildBodyContent(extraction);
  const headlineStructure = buildHeadlineStructure(extraction);
  const hasStructuredData = inferStructuredData(extraction);

  // Derive meta description from the first headline or empty
  const metaDescription = extraction.headlines.length > 0
    ? extraction.headlines[0].text
    : '';

  // Assume crawlable unless pagespeed data says otherwise
  const isCrawlable = pagespeed ? pagespeed.seo > 0 : true;

  const userPrompt = SEO_USER_PROMPT({
    businessType: business_type,
    industry: input.industry,
    technicalSeoScore,
    bodyContent,
    headlineStructure,
    hasStructuredData,
    metaDescription,
    isCrawlable,
  });

  // ---- Call Claude (Haiku for cheaper/faster analysis) ----
  let response;
  try {
    response = await callClaude({
      model: 'claude-haiku-4-5-20251001',
      systemPrompt: SEO_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 2048,
      temperature: 0.3,
    });
  } catch (err) {
    return buildFallbackResult(input, err);
  }

  // ---- Parse the JSON response ----
  let parsed: {
    sub_scores: Array<{
      key: string;
      score: number;
      evidence: string;
      evidence_quotes: string[];
    }>;
    summary_free: string;
    summary_gated: string;
    findings: Array<{
      title: string;
      severity: 'critical' | 'warning' | 'info';
      evidence: string;
      recommendation: string;
      playbook_chapter?: string;
    }>;
    quick_wins: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'quick' | 'moderate' | 'involved';
    }>;
  };

  try {
    parsed = extractJson(response.content) as typeof parsed;
  } catch (err) {
    return buildFallbackResult(input, new Error(`Failed to parse Claude JSON response: ${(err as Error).message}`));
  }

  // ---- Map Claude sub_scores (0-10) to our format (0-100) ----
  const sub_scores = parsed.sub_scores.map((s) => {
    const meta = SUB_SCORE_META[s.key] ?? { label: s.key, weight: 1 / 5 };

    // For technical_seo, prefer the actual PageSpeed score when available
    const normalizedScore =
      s.key === 'technical_seo' && pagespeed
        ? technicalSeoScore
        : Math.round(Math.max(0, Math.min(100, s.score * 10)));

    return {
      key: s.key,
      label: meta.label,
      score: normalizedScore,
      weight: meta.weight,
      evidence:
        s.key === 'technical_seo' && pagespeed
          ? `PageSpeed SEO score: ${technicalSeoScore}/100. ${s.evidence}`
          : s.evidence,
      evidence_quotes: s.evidence_quotes ?? [],
    };
  });

  // Calculate weighted raw score
  const raw_score = sub_scores.reduce((sum, s) => sum + s.score * s.weight, 0);

  // ---- Build findings (validate severity) ----
  const validSeverities = new Set(['critical', 'warning', 'info']);
  const findings = (parsed.findings ?? []).map((f) => ({
    title: f.title,
    severity: (validSeverities.has(f.severity) ? f.severity : 'info') as 'critical' | 'warning' | 'info',
    evidence: f.evidence,
    recommendation: f.recommendation,
    playbook_chapter: f.playbook_chapter,
  }));

  // ---- Build quick wins (validate impact/effort) ----
  const validImpacts = new Set(['high', 'medium', 'low']);
  const validEfforts = new Set(['quick', 'moderate', 'involved']);
  const quick_wins = (parsed.quick_wins ?? []).map((qw) => ({
    title: qw.title,
    description: qw.description,
    impact: (validImpacts.has(qw.impact) ? qw.impact : 'medium') as 'high' | 'medium' | 'low',
    effort: (validEfforts.has(qw.effort) ? qw.effort : 'moderate') as 'quick' | 'moderate' | 'involved',
  }));

  return {
    dimension_key: 'seo',
    label: 'SEO & Content Quality',
    raw_score: Math.round(raw_score * 100) / 100,
    sub_scores,
    summary_free: parsed.summary_free,
    summary_gated: parsed.summary_gated,
    findings,
    quick_wins,
  };
}
