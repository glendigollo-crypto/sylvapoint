// Deep analysis: SEO & Content Quality — runs post-gate with Sonnet

import { buildIndustryLine, getIndustryContext } from '../industry-context';

export const DEEP_SEO_SYSTEM = `You are a senior SEO strategist performing a deep content quality audit.
Evaluate using Google's E-E-A-T guidelines, readability best practices, and modern SEO principles.
Provide specific, actionable recommendations with evidence.`;

export const DEEP_SEO_USER = (ctx: {
  businessType: string;
  industry?: string;
  technicalSeoScore: number;
  bodyContent: string;
  headlineStructure: string[];
  hasStructuredData: boolean;
  metaDescription: string;
  isCrawlable: boolean;
}) => {
  const il = buildIndustryLine(ctx.industry);
  const ig = getIndustryContext(ctx.industry, 'seo');

  return `Deep-analyze this ${ctx.businessType} company's${il} content quality.

## Technical SEO: ${ctx.technicalSeoScore}/100
## Meta: ${ctx.metaDescription || "Not found"}
## Crawlable: ${ctx.isCrawlable ? "Yes" : "No"} | Structured Data: ${ctx.hasStructuredData ? "Yes" : "No"}

## Headline Structure (top 25)
${ctx.headlineStructure.slice(0, 25).join("\n")}

## Content (first 5000 chars)
${ctx.bodyContent.slice(0, 5000)}

${ig ? `## Industry Context\n${ig}\n\n` : ''}For each sub-dimension provide score, detailed evidence, and recommendation:

1. technical_seo (25%) — PageSpeed score, crawlability, structured data
2. readability (20%) — sentence length, vocabulary, Flesch-Kincaid
3. eeat_signals (20%) — experience, expertise, authoritativeness, trust
4. content_depth (20%) — comprehensiveness, FAQ coverage, topical authority
5. content_freshness (15%) — dates, recency signals, updated content

Respond in JSON:
{
  "sub_scores": [
    { "key": "technical_seo", "score": 7, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "readability", "score": 6, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "eeat_signals", "score": 5, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "content_depth", "score": 6, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "content_freshness", "score": 4, "evidence": "detailed paragraph", "evidence_quotes": ["..."] }
  ],
  "summary_gated": "3-5 sentence deep SEO analysis with prioritized action items.",
  "findings": [
    { "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "...", "playbook_chapter": "Chapter 3: SEO" }
  ],
  "quick_wins": [
    { "title": "...", "description": "specific implementation steps", "impact": "high|medium|low", "effort": "quick|moderate|involved" }
  ]
}`;
};
