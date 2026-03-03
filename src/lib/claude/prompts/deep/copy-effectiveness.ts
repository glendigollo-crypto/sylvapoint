// Deep analysis: Copy Effectiveness — runs post-gate with Sonnet

import { buildIndustryLine, getIndustryContext } from '../industry-context';

export const DEEP_COPY_SYSTEM = `You are a world-class direct response copywriter performing a deep copy audit.
Evaluate using Claude Hopkins, David Ogilvy, and modern conversion copy principles.
Provide specific rewrites and direct quotes as evidence.`;

export const DEEP_COPY_USER = (ctx: {
  businessType: string;
  industry?: string;
  targetClients: string;
  headlines: string[];
  ctas: string[];
  bodyContent: string;
  aiTellScore: number;
  aiTellFlags: string[];
}) => {
  const il = buildIndustryLine(ctx.industry);
  const ig = getIndustryContext(ctx.industry, 'copy');

  return `Deep-analyze this ${ctx.businessType} company's${il} copy targeting "${ctx.targetClients}".

## Headlines (top 20)
${ctx.headlines.slice(0, 20).join("\n")}

## CTAs (top 15)
${ctx.ctas.slice(0, 15).join("\n")}

## Body Copy (first 4000 chars)
${ctx.bodyContent.slice(0, 4000)}

## AI-Tell Scanner: ${ctx.aiTellScore}/100. Flags: ${ctx.aiTellFlags.slice(0, 8).join(", ") || "None"}

${ig ? `## Industry Context\n${ig}\n\n` : ''}For each sub-dimension provide score, detailed evidence with quotes, and specific recommendation:

1. headline_quality (20%) — formula analysis, specificity, emotional triggers
2. cta_effectiveness (15%) — action-oriented, benefit-driven, urgency
3. proof_specificity (15%) — specific numbers, names, results, case studies
4. pain_articulation (15%) — customer pain understanding, empathy
5. page_structure (15%) — scanability, hierarchy, logical flow
6. ai_tell_score (10%) — AI content markers, naturalness
7. objection_handling (10%) — objection identification and resolution

Respond in JSON:
{
  "sub_scores": [
    { "key": "headline_quality", "score": 7, "evidence": "detailed paragraph", "evidence_quotes": ["direct quote"] },
    { "key": "cta_effectiveness", "score": 5, "evidence": "detailed paragraph", "evidence_quotes": ["direct quote"] },
    { "key": "proof_specificity", "score": 6, "evidence": "detailed paragraph", "evidence_quotes": ["direct quote"] },
    { "key": "pain_articulation", "score": 4, "evidence": "detailed paragraph", "evidence_quotes": ["direct quote"] },
    { "key": "page_structure", "score": 7, "evidence": "detailed paragraph", "evidence_quotes": ["direct quote"] },
    { "key": "ai_tell_score", "score": 8, "evidence": "detailed paragraph", "evidence_quotes": [] },
    { "key": "objection_handling", "score": 5, "evidence": "detailed paragraph", "evidence_quotes": ["direct quote"] }
  ],
  "summary_gated": "3-5 sentence deep analysis with rewrite suggestions.",
  "findings": [
    { "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "...", "playbook_chapter": "Chapter 2: Copy" }
  ],
  "quick_wins": [
    { "title": "...", "description": "specific rewrite or implementation steps", "impact": "high|medium|low", "effort": "quick|moderate|involved" }
  ]
}`;
};
