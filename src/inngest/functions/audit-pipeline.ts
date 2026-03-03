import { inngest } from '@/inngest/client';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { crawlWebsite } from '@/lib/crawl/firecrawl';
import { nativeCrawl } from '@/lib/crawl/native';
import { extractContent } from '@/lib/crawl/extractor';
import { detectSocialLinks } from '@/lib/crawl/social';
import { getPageSpeedScores } from '@/lib/lighthouse/pagespeed';
import { runScoringEngine } from '@/lib/scoring/engine';
import { getGrade } from '@/lib/scoring/grades';
import { getWeightProfile } from '@/lib/scoring/weights';
import { DEFAULT_TENANT_ID } from '@/lib/tenant';
import type { CrawlExtraction } from '@/types/scoring';
import type { PageSpeedResult } from '@/lib/scoring/types';
import type { SocialData } from '@/lib/crawl/social';
import type { BusinessType, TopGap } from '@/types/audit';

interface AuditStartEvent {
  data: {
    audit_id: string;
    url: string;
    business_type: string;
    target_clients: string;
    social_links: string;
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
    retries: 2,
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
    const { audit_id, url, business_type, target_clients, social_links } =
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
    // Step 2 — Crawl website + PageSpeed + Social detection in parallel
    // ---------------------------------------------------------------
    const crawlData = await step.run('crawl-website', async () => {
      const [firecrawlResult, pagespeedResult, socialResult] =
        await Promise.allSettled([
          crawlWebsite(url),
          getPageSpeedScores(url),
          Promise.resolve(null as SocialData | null), // Social detection runs on crawl results
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

      // Store raw crawl data
      await getAdminSupabase().from('crawl_data').insert({
        tenant_id: DEFAULT_TENANT_ID,
        audit_id: audit_id,
        firecrawl_raw: crawl,
        pagespeed_raw: pagespeed,
        social_data: social,
        pages_crawled: crawl.pagesCount,
        crawled_at: new Date().toISOString(),
      });

      await updateAudit(audit_id, {
        progress_pct: 25,
        current_step: 'Website crawled successfully',
      });

      return {
        pages: crawl.pages,
        pagesCount: crawl.pagesCount,
        pagespeed,
        social,
      };
    });

    // ---------------------------------------------------------------
    // Step 3 — Extract structured content
    // ---------------------------------------------------------------
    const extraction = await step.run('extract-content', async () => {
      const extracted = extractContent(crawlData.pages);

      // Store extracted content in crawl_data
      await getAdminSupabase()
        .from('crawl_data')
        .update({ extracted_content: extracted })
        .eq('audit_id', audit_id);

      await updateAudit(audit_id, {
        progress_pct: 35,
        current_step: 'Content extracted, starting analysis...',
      });

      return extracted as CrawlExtraction;
    });

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
    // Step 5 — Run all 6 dimension scorers
    // ---------------------------------------------------------------
    const scoringResult = await step.run('score-dimensions', async () => {
      try {
        const result = await runScoringEngine({
          audit_id,
          url,
          business_type: business_type as BusinessType,
          target_clients,
          extraction,
          pagespeed: crawlData.pagespeed as PageSpeedResult | undefined,
        });

        // Load weight profile for this business type
        const weights = await getWeightProfile(business_type as BusinessType);

        // Store dimension scores in DB
        for (const dim of result.dimensions) {
          const dimWeight = weights[dim.dimension]?.weight ?? 1;
          const weightedScore = Math.round(dim.score * dimWeight * 100) / 100;

          const { data: dimRow } = await getAdminSupabase()
            .from('dimension_scores')
            .insert({
              tenant_id: DEFAULT_TENANT_ID,
              audit_id,
              dimension_key: dim.dimension,
              label: dim.label,
              raw_score: dim.score,
              weighted_score: weightedScore,
              grade: dim.grade,
              summary_free: dim.summaryFree,
              summary_gated: dim.summaryGated,
              findings: dim.findings,
              quick_wins: dim.quickWins,
            })
            .select('id')
            .single();

          // Store sub-scores
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

        await updateAudit(audit_id, {
          progress_pct: 80,
          current_step: 'Dimensions scored, computing results...',
        });

        return result;
      } catch (scoringError) {
        console.error('[audit-pipeline] Scoring engine failed, using fallback:', scoringError);

        // Return a generic fallback score so the pipeline can still complete
        const fallbackScore = 30;

        await updateAudit(audit_id, {
          progress_pct: 80,
          current_step: 'Scoring completed with limited data...',
          error_message: 'Scoring engine encountered an error. Results are approximate.',
        });

        return {
          audit_id,
          composite_score: fallbackScore,
          composite_grade: 'F' as const,
          dimensions: [],
          top_gaps: [] as TopGap[],
        };
      }
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
