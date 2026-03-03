// Phase 2: Copy Effectiveness scoring prompt
// Slim "scorecard" version — scores + brief summary only.

import { buildIndustryLine, getIndustryContext } from './industry-context';

export const COPY_SYSTEM_PROMPT = `You are an expert copywriter. Score website copy effectiveness quickly and accurately. Be concise.`;

export const COPY_USER_PROMPT = (context: {
  businessType: string;
  industry?: string;
  targetClients: string;
  headlines: string[];
  ctas: string[];
  bodyContent: string;
  aiTellScore: number;
  aiTellFlags: string[];
}) => {
  const industryLine = buildIndustryLine(context.industry);
  const industryGuidance = getIndustryContext(context.industry, 'copy');

  return `Score this ${context.businessType} company's${industryLine} copy targeting "${context.targetClients}".

## Headlines (top 10)
${context.headlines.slice(0, 10).join("\n")}

## CTAs (top 10)
${context.ctas.slice(0, 10).join("\n")}

## Body (excerpt)
${context.bodyContent.slice(0, 1500)}

## AI-Tell Scanner: ${context.aiTellScore}/100. Flags: ${context.aiTellFlags.slice(0, 5).join(", ") || "None"}

${industryGuidance ? `## Industry Notes\n${industryGuidance}\n\n` : ''}Score 0-10 each:
1. headline_quality (20%) — proven formulas, specificity
2. cta_effectiveness (15%) — clear, action-oriented
3. proof_specificity (15%) — specific numbers, names, results
4. pain_articulation (15%) — understanding of customer pain
5. page_structure (15%) — scannable, clear hierarchy
6. ai_tell_score (10%) — use provided scanner score
7. objection_handling (10%) — addresses objections

Respond in JSON:
{
  "sub_scores": [
    { "key": "headline_quality", "score": 7, "evidence": "brief reason" },
    { "key": "cta_effectiveness", "score": 5, "evidence": "brief reason" },
    { "key": "proof_specificity", "score": 6, "evidence": "brief reason" },
    { "key": "pain_articulation", "score": 4, "evidence": "brief reason" },
    { "key": "page_structure", "score": 7, "evidence": "brief reason" },
    { "key": "ai_tell_score", "score": 8, "evidence": "brief reason" },
    { "key": "objection_handling", "score": 5, "evidence": "brief reason" }
  ],
  "summary_free": "One sentence overall assessment.",
  "findings": [{ "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "..." }],
  "quick_wins": [{ "title": "...", "description": "...", "impact": "high|medium|low", "effort": "quick|moderate|involved" }]
}`;
};
