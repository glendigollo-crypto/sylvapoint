import { inngest } from '@/inngest/client';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { crawlWebsite } from '@/lib/crawl/firecrawl';
import { nativeCrawl } from '@/lib/crawl/native';
import { extractContent } from '@/lib/crawl/extractor';
import { detectSocialLinks } from '@/lib/crawl/social';
import { getPageSpeedScores } from '@/lib/lighthouse/pagespeed';
import { getGrade } from '@/lib/scoring/grades';
import { getWeightProfile } from '@/lib/scoring/weights';
import type { WeightProfileMap } from '@/lib/scoring/weights';
import { DEFAULT_TENANT_ID } from '@/lib/tenant';
import type { CrawlExtraction, DimensionKey, DimensionScore, Grade } from '@/types/scoring';
import type { PageSpeedResult, ScorerInput, DimensionScorerResult } from '@/lib/scoring/types';
import type { SocialData } from '@/lib/crawl/social';
import type { CompetitorSnapshot } from '@/lib/scoring/types';
import { analyzeCompetitor } from '@/lib/crawl/competitor';
import type { BusinessType, TopGap } from '@/types/audit';

// Individual dimension scorers (each runs in its own Inngest step)
import { scorePositioning } from '@/lib/scoring/dimensions/positioning';
import { scoreCopyEffectiveness } from '@/lib/scoring/dimensions/copy-effectiveness';
import { scoreSeoContent } from '@/lib/scoring/dimensions/seo-content';
import { scoreLeadCapture } from '@/lib/scoring/dimensions/lead-capture';
import { scorePerformance } from '@/lib/scoring/dimensions/performance';
import { scoreVisualCreative } from '@/lib/scoring/dimensions/visual-creative';

interface AuditStartEvent {
  data: {
    audit_id: string;
    url: string;
    business_type: string;
    industry: string;
    target_clients: string;
    social_links: string;
    competitor_url: string;
  };
}

async function updateAudit(
  auditId: string,
  updates: Record<string, unknown>
) {
  const { error } = await getAdminSupabase()
    .from('audits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', auditId);
  if (error) throw new Error(`DB update failed: ${error.message}`);
}

export const auditPipeline = inngest.createFunction(
  {
    id: 'audit-pipeline',
    name: 'GTM Audit Pipeline',
    retries: 1,
    onFailure: async ({ error, event }) => {
      try {
        const eventData = (event?.data as Record<string, unknown>)?.event as Record<string, unknown> | undefined;
        const data = eventData?.data as Record<string, unknown> | undefined;
        const auditId = data?.audit_id as string | undefined;
        if (auditId) {
          await getAdminSupabase()
            .from('audits')
            .update({
              status: 'failed',
              error_message: error?.message ?? 'Unknown pipeline failure',
              updated_at: new Date().toISOString(),
            })
            .eq('id', auditId);
        }
      } catch (e) {
        console.error('[audit-pipeline] onFailure handler error:', e);
      }
    },
  },
  { event: 'audit/start' },
  async ({ event, step }) => {
    const { audit_id, url, business_type, industry, target_clients, social_links, competitor_url } =
      event.data as AuditStartEvent['data'];

    // ---------------------------------------------------------------
    // Step 1 — Mark as crawling
    // ---------------------------------------------------------------
    await step.run('update-status-crawling', async () => {
      await updateAudit(audit_id, {
        status: 'crawling',
        progress_pct: 5,
        current_step: 'Starting website crawl...',
      });
    });

    // ---------------------------------------------------------------
    // Step 2 — Crawl website + PageSpeed + Extract content
    //   (merged into one step to avoid passing huge raw pages between steps)
    // ---------------------------------------------------------------
    const crawlData = await step.run('crawl-and-extract', async () => {
      const [firecrawlResult, pagespeedResult] =
        await Promise.allSettled([
          crawlWebsite(url),
          getPageSpeedScores(url),
        ]);

      let crawl =
        firecrawlResult.status === 'fulfilled' ? firecrawlResult.value : null;
      const pagespeed =
        pagespeedResult.status === 'fulfilled' ? pagespeedResult.value : null;

      // Fallback to native fetch crawler if Firecrawl failed or returned no pages
      if (!crawl || crawl.pages.length === 0) {
        if (firecrawlResult.status === 'rejected') {
          console.warn(
            `[audit-pipeline] Firecrawl failed, falling back to native crawl: ${firecrawlResult.reason}`
          );
        }
        try {
          crawl = await nativeCrawl(url);
        } catch (nativeErr) {
          console.error('[audit-pipeline] Native crawl also failed:', nativeErr);
        }
      }

      if (!crawl || crawl.pages.length === 0) {
        await updateAudit(audit_id, {
          status: 'failed',
          error_message:
            'Unable to crawl the website. It may be behind authentication, blocking crawlers, or temporarily unavailable.',
        });
        throw new Error(
          'Unable to crawl the website. It may be behind authentication, blocking crawlers, or temporarily unavailable.'
        );
      }

      // Detect social links from crawled HTML
      const social = detectSocialLinks(crawl.pages, social_links || undefined);

      await updateAudit(audit_id, {
        progress_pct: 25,
        current_step: 'Website crawled successfully',
      });

      // Extract structured content immediately (avoids passing raw pages between steps)
      const extracted = extractContent(crawl.pages);

      // Store raw crawl data + extracted content in DB
      await getAdminSupabase().from('crawl_data').insert({
        tenant_id: DEFAULT_TENANT_ID,
        audit_id: audit_id,
        firecrawl_raw: crawl,
        pagespeed_raw: pagespeed,
        social_data: social,
        extracted_content: extracted,
        pages_crawled: crawl.pagesCount,
        crawled_at: new Date().toISOString(),
      });

      await updateAudit(audit_id, {
        progress_pct: 35,
        current_step: 'Content extracted, starting analysis...',
      });

      // Return only the small extracted data (not raw pages)
      return {
        extraction: extracted as CrawlExtraction,
        pagesCount: crawl.pagesCount,
        pagespeed,
        social,
      };
    });

    // ---------------------------------------------------------------
    // Step 3 — Analyze competitor (if provided) — isolated, graceful degradation
    // ---------------------------------------------------------------
    const competitorSnapshot = await step.run('analyze-competitor', async () => {
      if (!competitor_url) return null;

      try {
        await updateAudit(audit_id, {
          current_step: 'Analyzing competitor...',
        });
        const snapshot = await analyzeCompetitor(competitor_url);
        if (snapshot) {
          console.log(`[audit-pipeline] Competitor snapshot captured for ${competitor_url}`);
        } else {
          console.warn(`[audit-pipeline] Competitor analysis returned null for ${competitor_url}`);
        }
        return snapshot;
      } catch (err) {
        console.warn('[audit-pipeline] Competitor analysis failed (non-fatal):', err);
        return null;
      }
    }) as CompetitorSnapshot | null;

    // ---------------------------------------------------------------
    // Step 4 — Mark as analyzing
    // ---------------------------------------------------------------
    await step.run('update-status-analyzing', async () => {
      await updateAudit(audit_id, {
        status: 'analyzing',
        progress_pct: 40,
        current_step: 'Scoring positioning & messaging...',
      });
    });

    // ---------------------------------------------------------------
    // Step 5 — Run each dimension scorer as a separate Inngest step
    //   Each step gets its own serverless function invocation (up to 60s)
    //   so Claude API calls don't hit Vercel's function timeout.
    // ---------------------------------------------------------------
    const scorerInput: ScorerInput = {
      audit_id,
      url,
      business_type: business_type as BusinessType,
      industry: industry || undefined,
      target_clients,
      extraction: crawlData.extraction,
      pagespeed: crawlData.pagespeed as PageSpeedResult | undefined,
    };

    // Only positioning, copy, and visual scorers receive competitor data
    const competitorScorerInput: ScorerInput = competitorSnapshot
      ? { ...scorerInput, competitor: competitorSnapshot }
      : scorerInput;

    const DIMENSION_LABELS: Record<DimensionKey, string> = {
      positioning: 'Positioning & Messaging',
      copy: 'Copy Effectiveness',
      seo: 'SEO & Content Quality',
      lead_capture: 'Lead Capture',
      performance: 'Website Performance',
      visual: 'Visual & Creative',
    };

    // Helper: build a fallback result when a scorer fails entirely
    function makeFallback(key: DimensionKey): DimensionScorerResult {
      return {
        dimension_key: key,
        label: DIMENSION_LABELS[key],
        raw_score: 50,
        sub_scores: [],
        summary_free: `${DIMENSION_LABELS[key]} analysis could not be completed. Score is a neutral baseline.`,
        summary_gated: 'Detailed analysis unavailable. Please re-run the audit.',
        findings: [],
        quick_wins: [],
      };
    }

    // Run each scorer in its own step (each gets a fresh 60s timeout).
    // Wrap each in try-catch so one failing scorer doesn't crash the pipeline.
    const positioningResult = await step.run('score-positioning', async () => {
      await updateAudit(audit_id, { current_step: 'Scoring positioning & messaging...' });
      try { return await scorePositioning(competitorScorerInput); }
      catch (e) { console.error('[score-positioning]', e); return makeFallback('positioning'); }
    });

    const copyResult = await step.run('score-copy', async () => {
      await updateAudit(audit_id, { progress_pct: 50, current_step: 'Scoring copy effectiveness...' });
      try { return await scoreCopyEffectiveness(competitorScorerInput); }
      catch (e) { console.error('[score-copy]', e); return makeFallback('copy'); }
    });

    const seoResult = await step.run('score-seo', async () => {
      await updateAudit(audit_id, { progress_pct: 55, current_step: 'Scoring SEO & content...' });
      try { return await scoreSeoContent(scorerInput); }
      catch (e) { console.error('[score-seo]', e); return makeFallback('seo'); }
    });

    const leadResult = await step.run('score-lead-capture', async () => {
      await updateAudit(audit_id, { progress_pct: 60, current_step: 'Scoring lead capture...' });
      try { return await scoreLeadCapture(scorerInput); }
      catch (e) { console.error('[score-lead-capture]', e); return makeFallback('lead_capture'); }
    });

    const perfResult = await step.run('score-performance', async () => {
      await updateAudit(audit_id, { progress_pct: 65, current_step: 'Scoring performance...' });
      try { return await scorePerformance(scorerInput); }
      catch (e) { console.error('[score-performance]', e); return makeFallback('performance'); }
    });

    const visualResult = await step.run('score-visual', async () => {
      await updateAudit(audit_id, { progress_pct: 70, current_step: 'Scoring visual & creative...' });
      try { return await scoreVisualCreative(competitorScorerInput); }
      catch (e) { console.error('[score-visual]', e); return makeFallback('visual'); }
    });

    // ---------------------------------------------------------------
    // Step 5b — Aggregate scores & store in DB
    // ---------------------------------------------------------------
    const scoringResult = await step.run('aggregate-scores', async () => {
      const weights = await getWeightProfile(business_type as BusinessType);

      const scorerResults: { key: DimensionKey; result: DimensionScorerResult }[] = [
        { key: 'positioning', result: positioningResult },
        { key: 'copy', result: copyResult },
        { key: 'seo', result: seoResult },
        { key: 'lead_capture', result: leadResult },
        { key: 'performance', result: perfResult },
        { key: 'visual', result: visualResult },
      ];

      const dimensions: DimensionScore[] = [];

      for (const { key, result } of scorerResults) {
        const dimWeight = weights[key];
        const subWeights = dimWeight?.subWeights ?? {};

        // Defensive: ensure arrays exist (they may be undefined after Inngest serialization)
        const subScoresArr = Array.isArray(result.sub_scores) ? result.sub_scores : [];
        const findingsArr = Array.isArray(result.findings) ? result.findings : [];
        const quickWinsArr = Array.isArray(result.quick_wins) ? result.quick_wins : [];

        // Apply sub-score weights
        let totalWeight = 0;
        let weightedSum = 0;
        for (const sub of subScoresArr) {
          const w = subWeights[sub.key] ?? sub.weight;
          weightedSum += sub.score * w;
          totalWeight += w;
        }
        // If no sub-scores, use the raw_score from the scorer directly
        const rawScore = subScoresArr.length === 0
          ? (result.raw_score ?? 50)
          : totalWeight > 0 && Math.abs(totalWeight - 1) > 0.001
            ? weightedSum / totalWeight
            : weightedSum;

        const grade = getGrade(rawScore) as Grade;
        const weightedScore = Math.round(rawScore * (dimWeight?.weight ?? 1) * 100) / 100;

        const dim: DimensionScore = {
          dimension: key,
          label: result.label ?? DIMENSION_LABELS[key],
          score: Math.round(rawScore * 100) / 100,
          grade,
          subScores: subScoresArr.map((s) => ({
            key: s.key,
            label: s.label,
            score: s.score,
            weight: subWeights[s.key] ?? s.weight,
            evidence: s.evidence,
            evidenceQuotes: s.evidence_quotes ?? [],
          })),
          summaryFree: result.summary_free ?? 'Analysis unavailable.',
          summaryGated: result.summary_gated ?? 'Detailed analysis unavailable.',
          findings: findingsArr.map((f) => ({
            title: f.title,
            severity: f.severity,
            evidence: f.evidence,
            recommendation: f.recommendation,
            playbook_chapter: f.playbook_chapter ?? null,
          })),
          quickWins: quickWinsArr.map((qw) => ({
            title: qw.title,
            description: qw.description,
            impact: qw.impact,
            effort: qw.effort,
            dimension_key: key,
          })),
        };

        dimensions.push(dim);

        console.log(`[aggregate] ${key}: rawScore=${rawScore.toFixed(2)}, dimScore=${dim.score}, weight=${dimWeight?.weight}, subs=${subScoresArr.length}, totalW=${totalWeight.toFixed(3)}`);

        // Store in DB
        const { data: dimRow, error: dimInsertError } = await getAdminSupabase()
          .from('dimension_scores')
          .insert({
            tenant_id: DEFAULT_TENANT_ID,
            audit_id,
            dimension_key: key,
            label: result.label,
            raw_score: dim.score,
            weighted_score: weightedScore,
            grade,
            summary_free: result.summary_free,
            summary_gated: result.summary_gated,
            findings: dim.findings,
            quick_wins: dim.quickWins,
          })
          .select('id')
          .single();

        if (dimInsertError) {
          console.error(`[aggregate] Failed to insert dimension_scores for ${key}:`, dimInsertError.message);
        }

        if (dimRow) {
          for (const sub of dim.subScores) {
            await getAdminSupabase().from('sub_scores').insert({
              tenant_id: DEFAULT_TENANT_ID,
              dimension_score_id: dimRow.id,
              audit_id,
              sub_score_key: sub.key,
              label: sub.label,
              score: sub.score,
              weight_within_dimension: sub.weight,
              evidence: sub.evidence,
              evidence_quotes: sub.evidenceQuotes,
            });
          }
        }
      }

      // Compute composite score
      let compositeScore = 0;
      for (const dim of dimensions) {
        const dw = weights[dim.dimension]?.weight ?? 0;
        console.log(`[composite] ${dim.dimension}: score=${dim.score} * weight=${dw} = ${(dim.score * dw).toFixed(2)}`);
        compositeScore += dim.score * dw;
      }
      console.log(`[composite] Raw total: ${compositeScore.toFixed(4)}`);
      compositeScore = Math.round(compositeScore * 100) / 100;
      console.log(`[composite] Final: ${compositeScore}`);
      const compositeGrade = getGrade(compositeScore) as Grade;

      // Identify top 3 gaps
      const sortedByScore = [...dimensions].sort((a, b) => a.score - b.score);
      const topGaps: TopGap[] = sortedByScore.slice(0, 3).map((dim) => ({
        dimension_key: dim.dimension,
        label: dim.label,
        score: dim.score,
        grade: dim.grade,
        quick_win: dim.quickWins.length > 0
          ? dim.quickWins[0].title
          : 'Review this dimension for improvement opportunities.',
      }));

      await updateAudit(audit_id, {
        progress_pct: 80,
        current_step: 'Dimensions scored, computing results...',
      });

      return {
        audit_id,
        composite_score: compositeScore,
        composite_grade: compositeGrade,
        dimensions,
        top_gaps: topGaps,
      };
    });

    // ---------------------------------------------------------------
    // Step 6 — Mark as scoring (final aggregation)
    // ---------------------------------------------------------------
    await step.run('update-status-scoring', async () => {
      await updateAudit(audit_id, {
        status: 'scoring',
        progress_pct: 90,
        current_step: 'Generating your scorecard...',
      });
    });

    // ---------------------------------------------------------------
    // Step 7 — Finalize: composite score, gaps, complete
    // ---------------------------------------------------------------
    await step.run('finalize-audit', async () => {
      const compositeScore = Math.round(scoringResult.composite_score);
      const compositeGrade = getGrade(compositeScore);

      // Build top gaps
      const topGaps = scoringResult.top_gaps.map((gap) => ({
        dimension_key: gap.dimension_key,
        label: gap.label,
        score: gap.score,
        grade: gap.grade,
        quick_win: gap.quick_win,
      }));

      // Build free-tier summary
      const worstDim = topGaps[0];
      const summaryParts = [
        `Your overall GTM readiness score is ${compositeScore}/100 (${compositeGrade}).`,
      ];
      if (worstDim) {
        summaryParts.push(
          `Your biggest gap is in ${worstDim.label} (${worstDim.grade}).`
        );
      }
      summaryParts.push(
        'Unlock your full report to see detailed findings and quick wins.'
      );

      await updateAudit(audit_id, {
        status: 'completed',
        progress_pct: 100,
        current_step: 'completed',
        composite_score: compositeScore,
        composite_grade: compositeGrade,
        top_gaps: topGaps,
        completed_at: new Date().toISOString(),
      });

      // Track analytics event
      await getAdminSupabase().from('analytics_events').insert({
        tenant_id: DEFAULT_TENANT_ID,
        event_type: 'audit_completed',
        audit_id,
        properties: {
          composite_score: compositeScore,
          composite_grade: compositeGrade,
          business_type,
          pages_crawled: crawlData.pagesCount,
        },
      });

      return { compositeScore, compositeGrade, topGaps };
    });
  }
);
