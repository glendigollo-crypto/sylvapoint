// Deep analysis: Positioning & Messaging — runs post-gate with Sonnet

import { buildIndustryLine, getIndustryContext } from '../industry-context';

export const DEEP_POSITIONING_SYSTEM = `You are a world-class GTM strategist performing a deep positioning audit.
Provide specific, actionable evidence with direct quotes from the content.
Every recommendation must be concrete enough to implement today.`;

export const DEEP_POSITIONING_USER = (ctx: {
  businessType: string;
  industry?: string;
  targetClients: string;
  headlines: string[];
  bodyContent: string;
  aboutContent: string;
  pricingContent: string;
}) => {
  const il = buildIndustryLine(ctx.industry);
  const ig = getIndustryContext(ctx.industry, 'positioning');

  return `Deep-analyze this ${ctx.businessType} company${il} targeting "${ctx.targetClients}".

## Headlines
${ctx.headlines.slice(0, 20).join("\n")}

## Body
${ctx.bodyContent.slice(0, 4000)}

## About
${ctx.aboutContent.slice(0, 2000)}

## Pricing
${ctx.pricingContent.slice(0, 2000)}
${ig ? `\n## Industry Context\n${ig}\n` : ''}
For each sub-dimension, provide:
- Score 0-10
- 2-3 sentence evidence paragraph
- 1-3 direct quotes from the content
- Specific recommendation

Sub-dimensions:
1. transformation_clarity (20%) — before→after transformation
2. differentiation (20%) — unique positioning vs alternatives
3. value_translation (15%) — features→outcomes
4. target_specificity (15%) — ideal customer definition
5. proof_arsenal (15%) — case studies, testimonials, data
6. mechanism_naming (15%) — named methodology/framework

Respond in JSON:
{
  "sub_scores": [
    { "key": "transformation_clarity", "score": 7, "evidence": "detailed paragraph", "evidence_quotes": ["direct quote 1", "direct quote 2"] },
    { "key": "differentiation", "score": 5, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "value_translation", "score": 6, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "target_specificity", "score": 4, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "proof_arsenal", "score": 8, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "mechanism_naming", "score": 3, "evidence": "detailed paragraph", "evidence_quotes": ["..."] }
  ],
  "summary_gated": "3-5 sentence deep analysis with specific strengths, weaknesses, and strategic recommendations.",
  "findings": [
    { "title": "...", "severity": "critical|warning|info", "evidence": "specific evidence", "recommendation": "actionable step", "playbook_chapter": "Chapter 1: Positioning" }
  ],
  "quick_wins": [
    { "title": "...", "description": "specific implementation steps", "impact": "high|medium|low", "effort": "quick|moderate|involved" }
  ]
}`;
};
