// ---------------------------------------------------------------------------
// Copy Effectiveness Scorer — SylvaPoint GTM Audit Tool
// Phase 2: Uses Claude Sonnet API + AI-Tell Scanner for copy analysis
// ---------------------------------------------------------------------------

import type { ScorerInput, DimensionScorerResult } from '../types';
import { buildCompetitorPromptSection } from '../types';
import { callClaude } from '@/lib/claude/client';
import {
  COPY_SYSTEM_PROMPT,
  COPY_USER_PROMPT,
} from '@/lib/claude/prompts/copy-effectiveness';
import { scanForAITells } from '@/lib/scoring/ai-tell-scanner';

// ---------------------------------------------------------------------------
// Sub-score metadata (matches the prompt's 7 sub-dimensions)
// ---------------------------------------------------------------------------

const SUB_SCORE_META: Record<string, { label: string; weight: number }> = {
  headline_quality:    { label: 'Headline Quality',    weight: 0.20 },
  cta_effectiveness:   { label: 'CTA Effectiveness',   weight: 0.15 },
  proof_specificity:   { label: 'Proof & Specificity', weight: 0.15 },
  pain_articulation:   { label: 'Pain Articulation',   weight: 0.15 },
  page_structure:      { label: 'Page Structure',      weight: 0.15 },
  ai_tell_score:       { label: 'AI-Tell Score',       weight: 0.10 },
  objection_handling:  { label: 'Objection Handling',  weight: 0.10 },
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

// Use shared robust JSON parser
import { extractJson } from '@/lib/scoring/json-repair';

// ---------------------------------------------------------------------------
// Fallback result when the Claude call fails
// ---------------------------------------------------------------------------

function buildFallbackResult(input: ScorerInput, error: unknown): DimensionScorerResult {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.error('[copy-effectiveness scorer] Claude call failed, using fallback:', errMsg);

  const sub_scores = Object.entries(SUB_SCORE_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    score: 50,
    weight: meta.weight,
    evidence: `[Fallback] Unable to complete AI analysis: ${errMsg}`,
    evidence_quotes: [] as string[],
  }));

  return {
    dimension_key: 'copy',
    label: 'Copy Effectiveness',
    raw_score: 50,
    sub_scores,
    summary_free:
      'Copy effectiveness analysis could not be completed at this time. Scores are set to a neutral baseline.',
    summary_gated:
      '[Detailed copy analysis was unavailable. Please retry the audit.]',
    findings: [
      {
        title: 'Copy analysis incomplete',
        severity: 'info',
        evidence: `AI analysis failed: ${errMsg}`,
        recommendation:
          'Re-run the audit to get a full copy effectiveness evaluation.',
      },
    ],
    quick_wins: [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score the Copy Effectiveness dimension using Claude Sonnet + AI-Tell Scanner.
 *
 * Runs the AI-tell heuristic scanner on extracted text, then sends all data
 * through the copy-effectiveness prompt template for deep analysis.
 *
 * @param input - Crawl extraction data and audit metadata
 * @returns Dimension scorer result with sub-scores, findings, and quick wins
 */
export async function scoreCopyEffectiveness(
  input: ScorerInput,
): Promise<DimensionScorerResult> {
  const { extraction, business_type, target_clients } = input;

  // ---- Run AI-Tell Scanner on all extracted text ----
  const bodyContent = buildBodyContent(extraction);
  const aiTellResult = scanForAITells(bodyContent);

  const aiTellFlags = aiTellResult.flaggedWords.map(
    (fw) => `${fw.word} (${fw.count}x)`,
  );

  // ---- Build prompt context ----
  const headlines = extraction.headlines.map((h) => `H${h.level}: ${h.text}`);
  const ctas = extraction.ctas;

  let userPrompt = COPY_USER_PROMPT({
    businessType: business_type,
    industry: input.industry,
    targetClients: target_clients,
    headlines,
    ctas,
    bodyContent,
    aiTellScore: aiTellResult.score,
    aiTellFlags,
  });

  // Append competitor context if available
  if (input.competitor) {
    userPrompt += buildCompetitorPromptSection(input.competitor);
  }

  // ---- Call Claude (Sonnet for deeper analysis) ----
  let response;
  try {
    response = await callClaude({
      model: 'claude-sonnet-4-6',
      systemPrompt: COPY_SYSTEM_PROMPT,
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
    const meta = SUB_SCORE_META[s.key] ?? { label: s.key, weight: 1 / 7 };

    // For ai_tell_score, use the scanner's direct 0-100 score
    const normalizedScore =
      s.key === 'ai_tell_score'
        ? aiTellResult.score
        : Math.round(Math.max(0, Math.min(100, s.score * 10)));

    return {
      key: s.key,
      label: meta.label,
      score: normalizedScore,
      weight: meta.weight,
      evidence:
        s.key === 'ai_tell_score'
          ? `AI-Tell Scanner: ${aiTellResult.score}/100. ${aiTellResult.totalFlags} flag(s) detected. Passive voice: ${aiTellResult.passiveVoicePercent}%. Contraction frequency: ${aiTellResult.contractionFrequency}%.`
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

  // Add AI-tell finding if significant flags were detected
  if (aiTellResult.totalFlags > 3) {
    findings.push({
      title: 'AI-generated content markers detected',
      severity: aiTellResult.score < 50 ? 'critical' : 'warning',
      evidence: `AI-Tell Scanner flagged ${aiTellResult.totalFlags} instances of common AI-generated phrases: ${aiTellFlags.slice(0, 5).join(', ')}. Score: ${aiTellResult.score}/100.`,
      recommendation:
        'Rewrite flagged sections using natural, conversational language. Replace AI buzzwords with specific, concrete terms. Add contractions and vary sentence length.',
      playbook_chapter: 'copy-ai-originality',
    });
  }

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
    dimension_key: 'copy',
    label: 'Copy Effectiveness',
    raw_score: Math.round(raw_score * 100) / 100,
    sub_scores,
    summary_free: parsed.summary_free,
    summary_gated: parsed.summary_gated,
    findings,
    quick_wins,
  };
}
