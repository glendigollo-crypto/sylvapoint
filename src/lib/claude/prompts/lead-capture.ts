// Phase 2: Lead Capture scoring prompt
// Slim "scorecard" version — scores + brief summary only.

import { buildIndustryLine, getIndustryContext } from './industry-context';

export const LEAD_CAPTURE_SYSTEM_PROMPT = `You are a conversion optimization expert. Score website lead capture quickly and accurately. Be concise.`;

export const LEAD_CAPTURE_USER_PROMPT = (context: {
  businessType: string;
  industry?: string;
  targetClients: string;
  forms: Array<{ fields: number; hasEmail: boolean; submitText: string }>;
  ctas: string[];
  hasLeadMagnet: boolean;
  testimonials: number;
  pricingExists: boolean;
}) => {
  const industryLine = buildIndustryLine(context.industry);
  const industryGuidance = getIndustryContext(context.industry, 'lead_capture');

  return `Score this ${context.businessType} company's${industryLine} lead capture targeting "${context.targetClients}".

## Forms
${context.forms.map((f, i) => `Form ${i + 1}: ${f.fields} fields, email: ${f.hasEmail}, submit: "${f.submitText}"`).join("\n") || "No forms found"}

## CTAs (top 10)
${context.ctas.slice(0, 10).join("\n") || "No CTAs found"}

## Lead Magnet: ${context.hasLeadMagnet ? "Yes" : "No"} | Testimonials: ${context.testimonials} | Pricing: ${context.pricingExists ? "Yes" : "No"}

${industryGuidance ? `## Industry Notes\n${industryGuidance}\n\n` : ''}Score 0-10 each:
1. lead_magnet_existence (20%) — clear free offer
2. offer_specificity (20%) — specific and valuable
3. form_friction (15%) — easy to complete
4. bridge_to_paid (15%) — clear free→paid path
5. social_proof_at_capture (15%) — proof near capture points
6. format_business_match (15%) — format fits business type

Respond in JSON:
{
  "sub_scores": [
    { "key": "lead_magnet_existence", "score": 5, "evidence": "brief reason" },
    { "key": "offer_specificity", "score": 4, "evidence": "brief reason" },
    { "key": "form_friction", "score": 6, "evidence": "brief reason" },
    { "key": "bridge_to_paid", "score": 5, "evidence": "brief reason" },
    { "key": "social_proof_at_capture", "score": 3, "evidence": "brief reason" },
    { "key": "format_business_match", "score": 4, "evidence": "brief reason" }
  ],
  "summary_free": "One sentence overall assessment.",
  "findings": [{ "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "..." }],
  "quick_wins": [{ "title": "...", "description": "...", "impact": "high|medium|low", "effort": "quick|moderate|involved" }]
}`;
};
