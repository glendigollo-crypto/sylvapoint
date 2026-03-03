// Phase 2: Positioning & Messaging scoring prompt
// Slim "scorecard" version — scores + brief summary only.
// Deep analysis (evidence_quotes, gated summary, playbook chapters)
// runs post-gate in a separate pass.

import { buildIndustryLine, getIndustryContext } from './industry-context';

export const POSITIONING_SYSTEM_PROMPT = `You are an expert GTM analyst. Score a website's positioning quickly and accurately. Be concise.`;

export const POSITIONING_USER_PROMPT = (context: {
  businessType: string;
  industry?: string;
  targetClients: string;
  headlines: string[];
  bodyContent: string;
  aboutContent: string;
  pricingContent: string;
}) => {
  const industryLine = buildIndustryLine(context.industry);
  const industryGuidance = getIndustryContext(context.industry, 'positioning');

  return `Score this ${context.businessType} company${industryLine} targeting "${context.targetClients}".

## Headlines
${context.headlines.slice(0, 10).join("\n")}

## Body (excerpt)
${context.bodyContent.slice(0, 1500)}

## About (excerpt)
${context.aboutContent.slice(0, 800)}

## Pricing
${context.pricingContent.slice(0, 800)}
${industryGuidance ? `\n## Industry Notes\n${industryGuidance}\n` : ''}
Score 0-10 each:
1. transformation_clarity (20%) — before→after clarity
2. differentiation (20%) — what makes them unique
3. value_translation (15%) — features→outcomes
4. target_specificity (15%) — how specific is ideal customer
5. proof_arsenal (15%) — case studies, testimonials, data
6. mechanism_naming (15%) — named methodology or framework

Respond in JSON:
{
  "sub_scores": [
    { "key": "transformation_clarity", "score": 7, "evidence": "brief reason" },
    { "key": "differentiation", "score": 5, "evidence": "brief reason" },
    { "key": "value_translation", "score": 6, "evidence": "brief reason" },
    { "key": "target_specificity", "score": 4, "evidence": "brief reason" },
    { "key": "proof_arsenal", "score": 8, "evidence": "brief reason" },
    { "key": "mechanism_naming", "score": 3, "evidence": "brief reason" }
  ],
  "summary_free": "One sentence overall assessment.",
  "findings": [{ "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "..." }],
  "quick_wins": [{ "title": "...", "description": "...", "impact": "high|medium|low", "effort": "quick|moderate|involved" }]
}`;
};
