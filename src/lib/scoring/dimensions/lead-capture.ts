// ---------------------------------------------------------------------------
// Lead Capture Scorer — SylvaPoint GTM Audit Tool
// Phase 2: Uses Claude Haiku API for lead capture analysis
// ---------------------------------------------------------------------------

import type { ScorerInput, DimensionScorerResult } from '../types';
import { callClaude } from '@/lib/claude/client';
import {
  LEAD_CAPTURE_SYSTEM_PROMPT,
  LEAD_CAPTURE_USER_PROMPT,
} from '@/lib/claude/prompts/lead-capture';

// ---------------------------------------------------------------------------
// Sub-score metadata (matches the prompt's 6 sub-dimensions)
// ---------------------------------------------------------------------------

const SUB_SCORE_META: Record<string, { label: string; weight: number }> = {
  lead_magnet_existence:  { label: 'Lead Magnet Existence',  weight: 0.20 },
  offer_specificity:      { label: 'Offer Specificity',      weight: 0.20 },
  form_friction:          { label: 'Form Friction',          weight: 0.15 },
  bridge_to_paid:         { label: 'Bridge to Paid',         weight: 0.15 },
  social_proof_at_capture:{ label: 'Social Proof at Capture', weight: 0.15 },
  format_business_match:  { label: 'Format-Business Match',  weight: 0.15 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect whether a lead magnet is present based on extraction signals.
 * Heuristics: CTAs mentioning free, download, guide, checklist, template, etc.
 */
function detectLeadMagnet(extraction: ScorerInput['extraction']): boolean {
  const leadMagnetPatterns =
    /\b(free|download|guide|checklist|template|toolkit|ebook|e-book|webinar|demo|trial|audit|report|whitepaper|worksheet)\b/i;

  for (const cta of extraction.ctas) {
    if (leadMagnetPatterns.test(cta)) return true;
  }
  for (const h of extraction.headlines) {
    if (leadMagnetPatterns.test(h.text)) return true;
  }
  return false;
}

// Use shared robust JSON parser
import { extractJson } from '@/lib/scoring/json-repair';

// ---------------------------------------------------------------------------
// Fallback result when the Claude call fails
// ---------------------------------------------------------------------------

function buildFallbackResult(input: ScorerInput, error: unknown): DimensionScorerResult {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.error('[lead-capture scorer] Claude call failed, using fallback:', errMsg);

  const sub_scores = Object.entries(SUB_SCORE_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    score: 50,
    weight: meta.weight,
    evidence: `[Fallback] Unable to complete AI analysis: ${errMsg}`,
    evidence_quotes: [] as string[],
  }));

  return {
    dimension_key: 'lead_capture',
    label: 'Lead Capture',
    raw_score: 50,
    sub_scores,
    summary_free:
      'Lead capture analysis could not be completed at this time. Scores are set to a neutral baseline.',
    summary_gated:
      '[Detailed lead capture analysis was unavailable. Please retry the audit.]',
    findings: [
      {
        title: 'Lead capture analysis incomplete',
        severity: 'info',
        evidence: `AI analysis failed: ${errMsg}`,
        recommendation:
          'Re-run the audit to get a full lead capture evaluation.',
      },
    ],
    quick_wins: [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score the Lead Capture dimension using Claude Haiku.
 *
 * Analyzes forms, CTAs, lead magnets, testimonials, and pricing presence
 * to evaluate the conversion funnel strength.
 *
 * @param input - Crawl extraction data and audit metadata
 * @returns Dimension scorer result with sub-scores, findings, and quick wins
 */
export async function scoreLeadCapture(
  input: ScorerInput,
): Promise<DimensionScorerResult> {
  const { extraction, business_type, target_clients } = input;

  // ---- Build prompt context from extraction data ----
  const forms = extraction.forms.map((f) => ({
    fields: f.fields.length,
    hasEmail: f.hasEmailField,
    submitText: f.fields.find((field) => field.type === 'submit')?.label
      ?? f.action
      ?? 'Submit',
  }));

  const ctas = extraction.ctas;
  const hasLeadMagnet = detectLeadMagnet(extraction);
  const testimonials = extraction.testimonials.length;
  const pricingExists = extraction.pricing.length > 0;

  const userPrompt = LEAD_CAPTURE_USER_PROMPT({
    businessType: business_type,
    industry: input.industry,
    targetClients: target_clients,
    forms,
    ctas,
    hasLeadMagnet,
    testimonials,
    pricingExists,
  });

  // ---- Call Claude (Haiku for cheaper/faster analysis) ----
  let response;
  try {
    response = await callClaude({
      model: 'claude-haiku-4-5-20251001',
      systemPrompt: LEAD_CAPTURE_SYSTEM_PROMPT,
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
    dimension_key: 'lead_capture',
    label: 'Lead Capture',
    raw_score: Math.round(raw_score * 100) / 100,
    sub_scores,
    summary_free: parsed.summary_free,
    summary_gated: parsed.summary_gated,
    findings,
    quick_wins,
  };
}
