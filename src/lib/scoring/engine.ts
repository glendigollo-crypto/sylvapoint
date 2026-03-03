// ---------------------------------------------------------------------------
// Scoring Engine — SylvaPoint GTM Audit Tool
// Orchestrates all 6 dimension scorers and computes the composite score
// ---------------------------------------------------------------------------

import type {
  DimensionKey,
  DimensionScore,
  ScoringResult,
} from '@/types/scoring';
import type { Grade } from '@/types/scoring';
import type { TopGap } from '@/types/audit';
import type { ScorerInput, DimensionScorerResult } from './types';
import { getGrade } from './grades';
import { getWeightProfile } from './weights';
import type { WeightProfileMap } from './weights';

// Dimension scorers
import { scorePositioning } from './dimensions/positioning';
import { scoreCopyEffectiveness } from './dimensions/copy-effectiveness';
import { scoreSeoContent } from './dimensions/seo-content';
import { scoreLeadCapture } from './dimensions/lead-capture';
import { scorePerformance } from './dimensions/performance';
import { scoreVisualCreative } from './dimensions/visual-creative';

// ---------------------------------------------------------------------------
// Dimension scorer registry
// ---------------------------------------------------------------------------

interface DimensionScorerEntry {
  key: DimensionKey;
  scorer: (input: ScorerInput) => Promise<DimensionScorerResult>;
}

const DIMENSION_SCORERS: DimensionScorerEntry[] = [
  { key: 'positioning', scorer: scorePositioning },
  { key: 'copy', scorer: scoreCopyEffectiveness },
  { key: 'seo', scorer: scoreSeoContent },
  { key: 'lead_capture', scorer: scoreLeadCapture },
  { key: 'performance', scorer: scorePerformance },
  { key: 'visual', scorer: scoreVisualCreative },
];

// ---------------------------------------------------------------------------
// Main scoring orchestrator
// ---------------------------------------------------------------------------

/**
 * Run the full scoring engine for an audit.
 *
 * 1. Loads the weight profile for the given business type
 * 2. Runs all 6 dimension scorers in parallel (via Promise.allSettled)
 * 3. Applies sub-score weights within each dimension
 * 4. Applies dimension weights to compute the composite score
 * 5. Identifies the top 3 gaps (lowest-scoring dimensions)
 * 6. Returns the complete ScoringResult
 *
 * @param input - The scorer input containing audit metadata and extraction data
 * @returns Complete scoring result ready for storage and display
 */
export async function runScoringEngine(
  input: ScorerInput
): Promise<ScoringResult> {
  // Step 1: Load weight profile
  const weights = await getWeightProfile(input.business_type);

  // Step 2: Run all dimension scorers in parallel
  const settledResults = await Promise.allSettled(
    DIMENSION_SCORERS.map(({ scorer }) => scorer(input))
  );

  // Step 3: Process results and apply weights
  const dimensions: DimensionScore[] = [];

  for (let i = 0; i < DIMENSION_SCORERS.length; i++) {
    const entry = DIMENSION_SCORERS[i];
    const settled = settledResults[i];

    if (settled.status === 'fulfilled') {
      const result = settled.value;
      const dimensionWeight = weights[entry.key];

      // Apply sub-score weights to compute the dimension's weighted raw_score
      const weightedRawScore = applySubWeights(result, dimensionWeight);

      const grade = getGrade(weightedRawScore);

      dimensions.push({
        dimension: entry.key,
        label: result.label,
        score: Math.round(weightedRawScore * 100) / 100,
        grade: grade as Grade,
        subScores: result.sub_scores.map((s) => ({
          key: s.key,
          label: s.label,
          score: s.score,
          weight: dimensionWeight.subWeights[s.key] ?? s.weight,
          evidence: s.evidence,
          evidenceQuotes: s.evidence_quotes,
        })),
        summaryFree: result.summary_free,
        summaryGated: result.summary_gated,
        findings: result.findings.map((f) => ({
          title: f.title,
          severity: f.severity,
          evidence: f.evidence,
          recommendation: f.recommendation,
          playbook_chapter: f.playbook_chapter ?? null,
        })),
        quickWins: result.quick_wins.map((qw) => ({
          title: qw.title,
          description: qw.description,
          impact: qw.impact,
          effort: qw.effort,
          dimension_key: entry.key,
        })),
      });
    } else {
      // Scorer failed — log the error and add a fallback dimension
      console.error(
        `[scoring-engine] Dimension "${entry.key}" scorer failed:`,
        settled.reason
      );

      dimensions.push(buildFallbackDimension(entry.key, weights));
    }
  }

  // Step 4: Compute composite score (weighted sum of dimension scores)
  let compositeScore = 0;
  for (const dim of dimensions) {
    const dimWeight = weights[dim.dimension]?.weight ?? 0;
    compositeScore += dim.score * dimWeight;
  }
  compositeScore = Math.round(compositeScore * 100) / 100;

  const compositeGrade = getGrade(compositeScore) as Grade;

  // Step 5: Identify top 3 gaps (bottom 3 dimensions by raw score)
  const sortedByScore = [...dimensions].sort((a, b) => a.score - b.score);
  const topGaps: TopGap[] = sortedByScore.slice(0, 3).map((dim) => ({
    dimension_key: dim.dimension,
    label: dim.label,
    score: dim.score,
    grade: dim.grade,
    quick_win:
      dim.quickWins.length > 0
        ? dim.quickWins[0].title
        : 'Review this dimension for improvement opportunities.',
  }));

  // Step 6: Return complete result
  return {
    audit_id: input.audit_id,
    composite_score: compositeScore,
    composite_grade: compositeGrade,
    dimensions,
    top_gaps: topGaps,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Apply sub-score weights from the weight profile to compute the dimension's
 * weighted score. If the weight profile has sub-weights for matching keys,
 * those are used; otherwise the scorer's own weights are used.
 */
function applySubWeights(
  result: DimensionScorerResult,
  dimensionWeight: { weight: number; subWeights: Record<string, number> }
): number {
  const subWeights = dimensionWeight.subWeights;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const subScore of result.sub_scores) {
    const weight = subWeights[subScore.key] ?? subScore.weight;
    weightedSum += subScore.score * weight;
    totalWeight += weight;
  }

  // Normalize if weights don't sum to 1
  if (totalWeight > 0 && Math.abs(totalWeight - 1) > 0.001) {
    return weightedSum / totalWeight;
  }

  return weightedSum;
}

/**
 * Build a fallback dimension result when a scorer fails.
 * Returns a neutral 50/100 score with an error notice.
 */
function buildFallbackDimension(
  key: DimensionKey,
  weights: WeightProfileMap
): DimensionScore {
  const LABELS: Record<DimensionKey, string> = {
    positioning: 'Positioning & Messaging',
    copy: 'Copy Effectiveness',
    seo: 'SEO & Content Quality',
    lead_capture: 'Lead Capture',
    performance: 'Website Performance',
    visual: 'Visual & Creative',
  };

  const grade = getGrade(50) as Grade;

  return {
    dimension: key,
    label: LABELS[key] ?? key,
    score: 50,
    grade,
    subScores: Object.entries(weights[key]?.subWeights ?? {}).map(
      ([subKey, weight]) => ({
        key: subKey,
        label: subKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        score: 50,
        weight,
        evidence: 'Scoring unavailable — using neutral baseline.',
        evidenceQuotes: [],
      })
    ),
    summaryFree:
      'This dimension could not be fully scored due to a processing error. The score shown is a neutral baseline.',
    summaryGated:
      'Detailed analysis for this dimension is currently unavailable. Please re-run the audit to get a full assessment.',
    findings: [
      {
        title: 'Dimension scoring incomplete',
        severity: 'info',
        evidence:
          'The scorer for this dimension encountered an error during execution.',
        recommendation:
          'Re-run the audit. If the issue persists, contact support.',
        playbook_chapter: null,
      },
    ],
    quickWins: [],
  };
}
