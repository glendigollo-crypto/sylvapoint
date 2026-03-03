// ---------------------------------------------------------------------------
// Positioning & Messaging Scorer — SylvaPoint GTM Audit Tool
// Phase 2: Uses Claude Sonnet API for deep positioning analysis
// ---------------------------------------------------------------------------

import type { ScorerInput, DimensionScorerResult } from '../types';
import { callClaude } from '@/lib/claude/client';
import {
  POSITIONING_SYSTEM_PROMPT,
  POSITIONING_USER_PROMPT,
} from '@/lib/claude/prompts/positioning';

// ---------------------------------------------------------------------------
// Sub-score metadata (used for mapping Claude response → DimensionScorerResult)
// ---------------------------------------------------------------------------

const SUB_SCORE_META: Record<string, { label: string; weight: number }> = {
  transformation_clarity: { label: 'Transformation Clarity', weight: 0.20 },
  differentiation:        { label: 'Differentiation',        weight: 0.20 },
  value_translation:      { label: 'Value Translation',      weight: 0.15 },
  target_specificity:     { label: 'Target Specificity',     weight: 0.15 },
  proof_arsenal:          { label: 'Proof Arsenal',          weight: 0.15 },
  mechanism_naming:       { label: 'Mechanism Naming',       weight: 0.15 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a body-content string from the extraction data to feed the prompt.
 */
function buildBodyContent(extraction: ScorerInput['extraction']): string {
  const parts: string[] = [];

  // Headlines
  for (const h of extraction.headlines) {
    parts.push(h.text);
  }

  // CTAs
  for (const cta of extraction.ctas) {
    parts.push(cta);
  }

  // Testimonials
  for (const t of extraction.testimonials) {
    const attribution = [t.author, t.role, t.company]
      .filter(Boolean)
      .join(', ');
    parts.push(`"${t.text}" — ${attribution || 'Anonymous'}`);
  }

  // FAQ
  for (const faq of extraction.faq) {
    parts.push(`Q: ${faq.question}\nA: ${faq.answer}`);
  }

  // Proof items
  for (const p of extraction.proof) {
    parts.push(p.text);
  }

  return parts.join('\n\n');
}

/**
 * Build a pricing-content string from pricing extraction data.
 */
function buildPricingContent(extraction: ScorerInput['extraction']): string {
  if (extraction.pricing.length === 0) return '';

  return extraction.pricing
    .map((p) => {
      const lines: string[] = [];
      if (p.planName) lines.push(`Plan: ${p.planName}`);
      if (p.price) lines.push(`Price: ${p.price}${p.interval ? ` / ${p.interval}` : ''}`);
      if (p.features.length > 0) lines.push(`Features: ${p.features.join(', ')}`);
      if (p.ctaText) lines.push(`CTA: ${p.ctaText}`);
      if (p.highlighted) lines.push('(Highlighted plan)');
      return lines.join('\n');
    })
    .join('\n\n');
}

// Use shared robust JSON parser
import { extractJson } from '@/lib/scoring/json-repair';

// ---------------------------------------------------------------------------
// Fallback result when the Claude call fails
// ---------------------------------------------------------------------------

function buildFallbackResult(input: ScorerInput, error: unknown): DimensionScorerResult {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.error('[positioning scorer] Claude call failed, using fallback:', errMsg);

  const sub_scores = Object.entries(SUB_SCORE_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    score: 50,
    weight: meta.weight,
    evidence: `[Fallback] Unable to complete AI analysis: ${errMsg}`,
    evidence_quotes: [] as string[],
  }));

  return {
    dimension_key: 'positioning',
    label: 'Positioning & Messaging',
    raw_score: 50,
    sub_scores,
    summary_free:
      'Positioning analysis could not be completed at this time. Scores are set to a neutral baseline.',
    summary_gated:
      '[Detailed positioning analysis was unavailable. Please retry the audit.]',
    findings: [
      {
        title: 'Positioning analysis incomplete',
        severity: 'info',
        evidence: `AI analysis failed: ${errMsg}`,
        recommendation:
          'Re-run the audit to get a full positioning and messaging evaluation.',
      },
    ],
    quick_wins: [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score the Positioning & Messaging dimension using Claude Sonnet.
 *
 * Sends extracted crawl data through the positioning prompt template and
 * parses the structured JSON response into sub-scores, findings, and quick wins.
 *
 * @param input - Crawl extraction data and audit metadata
 * @returns Dimension scorer result with sub-scores, findings, and quick wins
 */
export async function scorePositioning(
  input: ScorerInput,
): Promise<DimensionScorerResult> {
  const { extraction, business_type, target_clients } = input;

  // ---- Build prompt context from extraction data ----
  const headlines = extraction.headlines.map((h) => `H${h.level}: ${h.text}`);
  const bodyContent = buildBodyContent(extraction);
  const pricingContent = buildPricingContent(extraction);

  // About content: combine testimonials and proof as "about" signals
  const aboutParts: string[] = [];
  for (const t of extraction.testimonials) {
    aboutParts.push(`"${t.text}" — ${[t.author, t.role, t.company].filter(Boolean).join(', ')}`);
  }
  for (const p of extraction.proof) {
    aboutParts.push(`[${p.type}] ${p.text}`);
  }
  const aboutContent = aboutParts.join('\n');

  const userPrompt = POSITIONING_USER_PROMPT({
    businessType: business_type,
    industry: input.industry,
    targetClients: target_clients,
    headlines,
    bodyContent,
    aboutContent,
    pricingContent,
  });

  // ---- Call Claude (Sonnet for deeper analysis) ----
  let response;
  try {
    response = await callClaude({
      model: 'claude-sonnet-4-6',
      systemPrompt: POSITIONING_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 4096,
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

  // Validate required fields exist
  if (!Array.isArray(parsed.sub_scores)) {
    return buildFallbackResult(input, new Error('Claude response missing sub_scores array'));
  }
  parsed.findings = parsed.findings ?? [];
  parsed.quick_wins = parsed.quick_wins ?? [];

  // ---- Map Claude sub_scores (0-10) to our format (0-100) ----
  const sub_scores = parsed.sub_scores.map((s) => {
    const meta = SUB_SCORE_META[s.key] ?? { label: s.key, weight: 1 / 6 };
    return {
      key: s.key,
      label: meta.label,
      score: Math.round(Math.max(0, Math.min(100, s.score * 10))),
      weight: meta.weight,
      evidence: s.evidence,
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
    dimension_key: 'positioning',
    label: 'Positioning & Messaging',
    raw_score: Math.round(raw_score * 100) / 100,
    sub_scores,
    summary_free: parsed.summary_free,
    summary_gated: parsed.summary_gated,
    findings,
    quick_wins,
  };
}
