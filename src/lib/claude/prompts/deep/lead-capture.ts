// Deep analysis: Lead Capture — runs post-gate with Sonnet

import { buildIndustryLine, getIndustryContext } from '../industry-context';

export const DEEP_LEAD_SYSTEM = `You are a conversion optimization expert performing a deep lead capture audit.
Evaluate using conversion psychology, lead magnet best practices, and funnel optimization.
Provide specific, implementable recommendations.`;

export const DEEP_LEAD_USER = (ctx: {
  businessType: string;
  industry?: string;
  targetClients: string;
  forms: Array<{ fields: number; hasEmail: boolean; submitText: string }>;
  ctas: string[];
  hasLeadMagnet: boolean;
  testimonials: number;
  pricingExists: boolean;
}) => {
  const il = buildIndustryLine(ctx.industry);
  const ig = getIndustryContext(ctx.industry, 'lead_capture');

  return `Deep-analyze this ${ctx.businessType} company's${il} lead capture targeting "${ctx.targetClients}".

## Forms
${ctx.forms.map((f, i) => `Form ${i + 1}: ${f.fields} fields, email: ${f.hasEmail}, submit: "${f.submitText}"`).join("\n") || "No forms found"}

## CTAs (top 15)
${ctx.ctas.slice(0, 15).join("\n") || "No CTAs found"}

## Lead Magnet: ${ctx.hasLeadMagnet ? "Yes" : "No"} | Testimonials: ${ctx.testimonials} | Pricing: ${ctx.pricingExists ? "Yes" : "No"}

${ig ? `## Industry Context\n${ig}\n\n` : ''}For each sub-dimension provide score, evidence, and recommendation:

1. lead_magnet_existence (20%) — free offer presence and quality
2. offer_specificity (20%) — relevance to target audience
3. form_friction (15%) — field count, UX, completion ease
4. bridge_to_paid (15%) — free→paid conversion path
5. social_proof_at_capture (15%) — proof near capture points
6. format_business_match (15%) — lead magnet format fit

Respond in JSON:
{
  "sub_scores": [
    { "key": "lead_magnet_existence", "score": 5, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "offer_specificity", "score": 4, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "form_friction", "score": 6, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "bridge_to_paid", "score": 5, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "social_proof_at_capture", "score": 3, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "format_business_match", "score": 4, "evidence": "detailed paragraph", "evidence_quotes": ["..."] }
  ],
  "summary_gated": "3-5 sentence deep conversion analysis with specific lead magnet recommendations.",
  "findings": [
    { "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "...", "playbook_chapter": "Chapter 4: Lead Capture" }
  ],
  "quick_wins": [
    { "title": "...", "description": "specific implementation steps", "impact": "high|medium|low", "effort": "quick|moderate|involved" }
  ]
}`;
};
