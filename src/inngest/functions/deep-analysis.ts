// ---------------------------------------------------------------------------
// Deep Analysis Pipeline — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Triggered post-gate (email capture or payment). Runs full Sonnet analysis
// on already-crawled data and enriches dimension_scores with detailed
// evidence, quotes, gated summaries, and playbook chapters.
// ---------------------------------------------------------------------------

import { inngest } from '@/inngest/client';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { callClaude } from '@/lib/claude/client';
import { extractJson } from '@/lib/scoring/json-repair';
import { DEFAULT_TENANT_ID } from '@/lib/tenant';

// Deep prompts (Sonnet-grade)
import { DEEP_POSITIONING_SYSTEM, DEEP_POSITIONING_USER } from '@/lib/claude/prompts/deep/positioning';
import { DEEP_COPY_SYSTEM, DEEP_COPY_USER } from '@/lib/claude/prompts/deep/copy-effectiveness';
import { DEEP_SEO_SYSTEM, DEEP_SEO_USER } from '@/lib/claude/prompts/deep/seo-content';
import { DEEP_LEAD_SYSTEM, DEEP_LEAD_USER } from '@/lib/claude/prompts/deep/lead-capture';
import { DEEP_VISUAL_SYSTEM, DEEP_VISUAL_USER } from '@/lib/claude/prompts/deep/visual-creative';

import { scanForAITells } from '@/lib/scoring/ai-tell-scanner';

import type { CrawlExtraction } from '@/types/scoring';
import type { PageSpeedResult } from '@/lib/scoring/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeepAnalysisEvent {
  data: {
    audit_id: string;
    url: string;
    business_type: string;
    industry: string;
    target_clients: string;
  };
}

interface DeepResult {
  sub_scores?: Array<{
    key: string;
    score: number;
    evidence: string;
    evidence_quotes?: string[];
  }>;
  summary_gated?: string;
  findings?: Array<{
    title: string;
    severity: string;
    evidence: string;
    recommendation: string;
    playbook_chapter?: string;
  }>;
  quick_wins?: Array<{
    title: string;
    description: string;
    impact: string;
    effort: string;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildBodyContent(extraction: CrawlExtraction): string {
  const parts: string[] = [];
  for (const h of extraction.headlines) parts.push(h.text);
  for (const cta of extraction.ctas) parts.push(cta);
  for (const t of extraction.testimonials) {
    const attr = [t.author, t.role, t.company].filter(Boolean).join(', ');
    parts.push(`"${t.text}" — ${attr || 'Anonymous'}`);
  }
  for (const faq of extraction.faq) parts.push(`Q: ${faq.question}\nA: ${faq.answer}`);
  for (const p of extraction.proof) parts.push(p.text);
  return parts.join('\n\n');
}

async function runDeepScorer(
  dimensionKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<DeepResult | null> {
  try {
    console.log(`[deep-analysis] Running ${dimensionKey} with Sonnet...`);
    const response = await callClaude({
      model: 'claude-sonnet-4-6',
      systemPrompt,
      userPrompt,
      maxTokens: 4096,
      temperature: 0.3,
    });
    const parsed = extractJson(response.content) as DeepResult;
    console.log(`[deep-analysis] ${dimensionKey} complete (${response.usage.outputTokens} tokens)`);
    return parsed;
  } catch (err) {
    console.error(`[deep-analysis] ${dimensionKey} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function enrichDimensionScore(
  auditId: string,
  dimensionKey: string,
  deep: DeepResult,
): Promise<void> {
  const supabase = getAdminSupabase();

  // Build enrichment data
  const update: Record<string, unknown> = {};

  if (deep.summary_gated) {
    update.summary_gated = deep.summary_gated;
  }

  if (deep.findings && deep.findings.length > 0) {
    update.findings = deep.findings;
  }

  if (deep.quick_wins && deep.quick_wins.length > 0) {
    update.quick_wins = deep.quick_wins;
  }

  // Update dimension_scores row
  const { error } = await supabase
    .from('dimension_scores')
    .update(update)
    .eq('audit_id', auditId)
    .eq('dimension_key', dimensionKey);

  if (error) {
    console.error(`[deep-analysis] Failed to update ${dimensionKey}:`, error.message);
    return;
  }

  // Update sub_scores with evidence_quotes if available
  if (deep.sub_scores) {
    // Get the dimension_score ID
    const { data: dimRow } = await supabase
      .from('dimension_scores')
      .select('id')
      .eq('audit_id', auditId)
      .eq('dimension_key', dimensionKey)
      .single();

    if (dimRow) {
      for (const sub of deep.sub_scores) {
        if (sub.evidence_quotes && sub.evidence_quotes.length > 0) {
          await supabase
            .from('sub_scores')
            .update({
              evidence: sub.evidence,
              evidence_quotes: sub.evidence_quotes,
            })
            .eq('dimension_score_id', dimRow.id)
            .eq('sub_score_key', sub.key);
        }
      }
    }
  }

  console.log(`[deep-analysis] Enriched ${dimensionKey} with deep analysis`);
}

// ---------------------------------------------------------------------------
// Inngest Function
// ---------------------------------------------------------------------------

export const deepAnalysisPipeline = inngest.createFunction(
  {
    id: 'deep-analysis-pipeline',
    name: 'Deep Analysis Pipeline (Post-Gate)',
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
              deep_analysis_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', auditId);
        }
      } catch (e) {
        console.error('[deep-analysis] onFailure handler error:', e);
      }
    },
  },
  { event: 'audit/deep-analysis' },
  async ({ event, step }) => {
    const { audit_id, url, business_type, industry, target_clients } =
      event.data as DeepAnalysisEvent['data'];

    console.log(`[deep-analysis] Starting for audit ${audit_id} (${url})`);

    // Mark as in-progress
    await step.run('mark-deep-started', async () => {
      await getAdminSupabase()
        .from('audits')
        .update({
          deep_analysis_status: 'running',
          updated_at: new Date().toISOString(),
        })
        .eq('id', audit_id);
    });

    // Load crawl data from DB (already stored during initial audit)
    const crawlData = await step.run('load-crawl-data', async () => {
      const { data, error } = await getAdminSupabase()
        .from('crawl_data')
        .select('extracted_content, pagespeed_raw')
        .eq('audit_id', audit_id)
        .single();

      if (error || !data) {
        throw new Error(`No crawl data found for audit ${audit_id}`);
      }

      return {
        extraction: data.extracted_content as CrawlExtraction,
        pagespeed: data.pagespeed_raw as PageSpeedResult | null,
      };
    });

    const extraction = crawlData.extraction;
    const bodyContent = buildBodyContent(extraction);
    const headlines = extraction.headlines.map((h) => `H${h.level}: ${h.text}`);

    // Run all 5 deep scorers as separate steps (each gets its own 60s budget)

    const deepPositioning = await step.run('deep-positioning', async () => {
      const aboutParts: string[] = [];
      for (const t of extraction.testimonials) {
        aboutParts.push(`"${t.text}" — ${[t.author, t.role, t.company].filter(Boolean).join(', ')}`);
      }
      for (const p of extraction.proof) aboutParts.push(`[${p.type}] ${p.text}`);

      const pricingContent = extraction.pricing
        .map((p) => {
          const lines: string[] = [];
          if (p.planName) lines.push(`Plan: ${p.planName}`);
          if (p.price) lines.push(`Price: ${p.price}${p.interval ? ` / ${p.interval}` : ''}`);
          if (p.features.length > 0) lines.push(`Features: ${p.features.join(', ')}`);
          return lines.join('\n');
        })
        .join('\n\n');

      return runDeepScorer('positioning', DEEP_POSITIONING_SYSTEM,
        DEEP_POSITIONING_USER({
          businessType: business_type,
          industry: industry || undefined,
          targetClients: target_clients,
          headlines,
          bodyContent,
          aboutContent: aboutParts.join('\n'),
          pricingContent,
        })
      );
    });

    const deepCopy = await step.run('deep-copy', async () => {
      const aiTellResult = scanForAITells(bodyContent);
      return runDeepScorer('copy', DEEP_COPY_SYSTEM,
        DEEP_COPY_USER({
          businessType: business_type,
          industry: industry || undefined,
          targetClients: target_clients,
          headlines,
          ctas: extraction.ctas,
          bodyContent,
          aiTellScore: aiTellResult.score,
          aiTellFlags: aiTellResult.flaggedWords.map((fw) => `${fw.word} (${fw.count}x)`),
        })
      );
    });

    const deepSeo = await step.run('deep-seo', async () => {
      const pagespeed = crawlData.pagespeed;
      const technicalSeoScore = pagespeed?.seo ?? 50;
      const hasStructuredData = pagespeed?.audits?.['structured-data']?.score === 1;
      const metaDescription = pagespeed?.audits?.['meta-description']?.title ?? '';
      const isCrawlable = pagespeed?.audits?.['is-crawlable']?.score === 1;
      const headlineStructure = extraction.headlines.map(
        (h) => `${'#'.repeat(h.level)} ${h.text}`
      );

      return runDeepScorer('seo', DEEP_SEO_SYSTEM,
        DEEP_SEO_USER({
          businessType: business_type,
          industry: industry || undefined,
          technicalSeoScore,
          bodyContent,
          headlineStructure,
          hasStructuredData,
          metaDescription,
          isCrawlable,
        })
      );
    });

    const deepLead = await step.run('deep-lead-capture', async () => {
      const mappedForms = extraction.forms.map((f) => ({
        fields: f.fields.length,
        hasEmail: f.hasEmailField,
        submitText: f.fields.find((field) => field.type === 'submit')?.label
          ?? f.action
          ?? 'Submit',
      }));

      return runDeepScorer('lead_capture', DEEP_LEAD_SYSTEM,
        DEEP_LEAD_USER({
          businessType: business_type,
          industry: industry || undefined,
          targetClients: target_clients,
          forms: mappedForms,
          ctas: extraction.ctas,
          hasLeadMagnet: extraction.ctas.some((c) =>
            /free|download|guide|checklist|template|demo|trial/i.test(c)
          ),
          testimonials: extraction.testimonials.length,
          pricingExists: extraction.pricing.length > 0,
        })
      );
    });

    const deepVisual = await step.run('deep-visual', async () => {
      return runDeepScorer('visual', DEEP_VISUAL_SYSTEM,
        DEEP_VISUAL_USER({
          businessType: business_type,
          industry: industry || undefined,
          imageCount: extraction.images.length,
          videoCount: extraction.videos.length,
          hasHeroImage: extraction.images.some((img) => img.isHero),
          imagesWithAlt: extraction.images.filter((img) => img.alt).length,
          totalImages: extraction.images.length,
          videoSources: extraction.videos.map((v) => v.platform),
          bodyContent,
        })
      );
    });

    // Enrich all dimension_scores with deep results
    await step.run('enrich-dimensions', async () => {
      const results: [string, DeepResult | null][] = [
        ['positioning', deepPositioning],
        ['copy', deepCopy],
        ['seo', deepSeo],
        ['lead_capture', deepLead],
        ['visual', deepVisual],
      ];

      let enrichedCount = 0;
      for (const [key, result] of results) {
        if (result) {
          await enrichDimensionScore(audit_id, key, result);
          enrichedCount++;
        }
      }

      // Mark deep analysis as complete
      await getAdminSupabase()
        .from('audits')
        .update({
          deep_analysis_status: 'complete',
          updated_at: new Date().toISOString(),
        })
        .eq('id', audit_id);

      console.log(`[deep-analysis] Complete for ${audit_id}: ${enrichedCount}/5 dimensions enriched`);
    });
  }
);
