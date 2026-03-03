// Phase 2: SEO & Content Quality scoring prompt
// Slim "scorecard" version — scores + brief summary only.

import { buildIndustryLine, getIndustryContext } from './industry-context';

export const SEO_SYSTEM_PROMPT = `You are an SEO analyst. Score website content quality quickly and accurately. Be concise.`;

export const SEO_USER_PROMPT = (context: {
  businessType: string;
  industry?: string;
  technicalSeoScore: number;
  bodyContent: string;
  headlineStructure: string[];
  hasStructuredData: boolean;
  metaDescription: string;
  isCrawlable: boolean;
}) => {
  const industryLine = buildIndustryLine(context.industry);
  const industryGuidance = getIndustryContext(context.industry, 'seo');

  return `Score this ${context.businessType} company's${industryLine} content quality.

## Technical SEO: ${context.technicalSeoScore}/100
## Meta: ${context.metaDescription || "Not found"}
## Crawlable: ${context.isCrawlable ? "Yes" : "No"} | Structured Data: ${context.hasStructuredData ? "Yes" : "No"}

## Headline Structure (top 15)
${context.headlineStructure.slice(0, 15).join("\n")}

## Content (excerpt)
${context.bodyContent.slice(0, 2000)}

${industryGuidance ? `## Industry Notes\n${industryGuidance}\n\n` : ''}Score 0-10 each:
1. technical_seo (25%) — use provided PageSpeed SEO score
2. readability (20%) — easy to read, appropriate vocabulary
3. eeat_signals (20%) — experience, expertise, authority, trust
4. content_depth (20%) — comprehensive, answers questions
5. content_freshness (15%) — date indicators, recent content

Respond in JSON:
{
  "sub_scores": [
    { "key": "technical_seo", "score": 7, "evidence": "brief reason" },
    { "key": "readability", "score": 6, "evidence": "brief reason" },
    { "key": "eeat_signals", "score": 5, "evidence": "brief reason" },
    { "key": "content_depth", "score": 6, "evidence": "brief reason" },
    { "key": "content_freshness", "score": 4, "evidence": "brief reason" }
  ],
  "summary_free": "One sentence overall assessment.",
  "findings": [{ "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "..." }],
  "quick_wins": [{ "title": "...", "description": "...", "impact": "high|medium|low", "effort": "quick|moderate|involved" }]
}`;
};
