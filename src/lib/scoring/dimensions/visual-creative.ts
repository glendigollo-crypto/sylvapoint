// ---------------------------------------------------------------------------
// Visual & Creative Scorer — SylvaPoint GTM Audit Tool
// Phase 2: Uses Claude Sonnet API for visual and creative analysis
// ---------------------------------------------------------------------------

import type { ScorerInput, DimensionScorerResult } from '../types';
import { buildCompetitorPromptSection } from '../types';
import { callClaude } from '@/lib/claude/client';
import {
  VISUAL_SYSTEM_PROMPT,
  VISUAL_USER_PROMPT,
} from '@/lib/claude/prompts/visual-creative';

// ---------------------------------------------------------------------------
// Sub-score metadata (matches the prompt's 5 sub-dimensions)
// ---------------------------------------------------------------------------

const SUB_SCORE_META: Record<string, { label: string; weight: number }> = {
  product_photography_quality: { label: 'Product Photography Quality', weight: 0.20 },
  video_content_presence:      { label: 'Video Content Presence',      weight: 0.20 },
  platform_visual_compliance:  { label: 'Platform Visual Compliance',  weight: 0.20 },
  brand_visual_consistency:    { label: 'Brand Visual Consistency',    weight: 0.20 },
  human_presence_authenticity: { label: 'Human Presence & Authenticity', weight: 0.20 },
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
  for (const p of extraction.proof) {
    parts.push(p.text);
  }

  return parts.join('\n\n');
}

// Use shared robust JSON parser
import { extractJson } from '@/lib/scoring/json-repair';

// ---------------------------------------------------------------------------
// Fallback result when the Claude call fails
// ---------------------------------------------------------------------------

function buildFallbackResult(input: ScorerInput, error: unknown): DimensionScorerResult {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.error('[visual-creative scorer] Claude call failed, using fallback:', errMsg);

  const sub_scores = Object.entries(SUB_SCORE_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    score: 50,
    weight: meta.weight,
    evidence: `[Fallback] Unable to complete AI analysis: ${errMsg}`,
    evidence_quotes: [] as string[],
  }));

  return {
    dimension_key: 'visual',
    label: 'Visual & Creative',
    raw_score: 50,
    sub_scores,
    summary_free:
      'Visual and creative analysis could not be completed at this time. Scores are set to a neutral baseline.',
    summary_gated:
      '[Detailed visual analysis was unavailable. Please retry the audit.]',
    findings: [
      {
        title: 'Visual analysis incomplete',
        severity: 'info',
        evidence: `AI analysis failed: ${errMsg}`,
        recommendation:
          'Re-run the audit to get a full visual and creative evaluation.',
      },
    ],
    quick_wins: [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score the Visual & Creative dimension using Claude Sonnet.
 *
 * Analyzes image count, hero image presence, alt text coverage, video content,
 * and overall visual identity through the Claude prompt template.
 *
 * @param input - Crawl extraction data and audit metadata
 * @returns Dimension scorer result with sub-scores, findings, and quick wins
 */
export async function scoreVisualCreative(
  input: ScorerInput,
): Promise<DimensionScorerResult> {
  const { extraction, business_type } = input;

  // ---- Build prompt context from extraction data ----
  const imageCount = extraction.images.length;
  const videoCount = extraction.videos.length;
  const hasHeroImage = extraction.images.some((img) => img.isHero);
  const imagesWithAlt = extraction.images.filter((img) => img.alt).length;
  const totalImages = extraction.images.length;
  const videoSources = extraction.videos.map((v) => v.platform);
  const bodyContent = buildBodyContent(extraction);

  let userPrompt = VISUAL_USER_PROMPT({
    businessType: business_type,
    industry: input.industry,
    imageCount,
    videoCount,
    hasHeroImage,
    imagesWithAlt,
    totalImages,
    videoSources,
    bodyContent,
  });

  // Append competitor context if available
  if (input.competitor) {
    userPrompt += buildCompetitorPromptSection(input.competitor);
  }

  // ---- Call Claude (Sonnet for deeper creative analysis) ----
  let response;
  try {
    response = await callClaude({
      model: 'claude-haiku-4-5-20251001',
      systemPrompt: VISUAL_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 1500,
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
    summary_gated?: string;
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
    const meta = SUB_SCORE_META[s.key] ?? { label: s.key, weight: 0.20 };
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
    dimension_key: 'visual',
    label: 'Visual & Creative',
    raw_score: Math.round(raw_score * 100) / 100,
    sub_scores,
    summary_free: parsed.summary_free,
    summary_gated: parsed.summary_gated ?? '[Unlock the full report for detailed analysis and recommendations.]',
    findings,
    quick_wins,
  };
}
