// Phase 2: Lead Capture scoring prompt
// Encodes 15 lead magnet formats, conversion psychology

import { buildIndustryLine, getIndustryContext } from './industry-context';

export const LEAD_CAPTURE_SYSTEM_PROMPT = `You are a conversion optimization expert scoring website lead capture systems.

You evaluate based on:
- 15 lead magnet formats: checklist, template, toolkit, swipe file, calculator, quiz, webinar, free trial, demo, case study, report, email course, community, consultation, audit
- Conversion psychology: reciprocity, commitment, social proof, authority, scarcity, liking
- Form friction analysis
- Bridge-to-paid path clarity

Score each sub-dimension 0-10 with specific evidence.`;

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

  return `Analyze this ${context.businessType} company's${industryLine} lead capture targeting "${context.targetClients}".

## Forms Found
${context.forms.map((f, i) => `Form ${i + 1}: ${f.fields} fields, email: ${f.hasEmail}, submit: "${f.submitText}"`).join("\n") || "No forms found"}

## CTAs (top 15)
${context.ctas.slice(0, 15).join("\n") || "No CTAs found"}

## Lead Magnet Detected: ${context.hasLeadMagnet ? "Yes" : "No"}
## Testimonials Count: ${context.testimonials}
## Pricing Page Exists: ${context.pricingExists ? "Yes" : "No"}

${industryGuidance ? `## Industry-Specific Guidance\n${industryGuidance}\n\n` : ''}Score:
1. **Lead Magnet Existence** (20%): Is there a clear lead magnet or free offer?
2. **Offer Specificity** (20%): Is the lead magnet specific and valuable to the target audience?
3. **Form Friction** (15%): How many fields? Is it easy to complete?
4. **Bridge to Paid** (15%): Is there a clear path from free to paid?
5. **Social Proof at Capture** (15%): Are testimonials/proof near capture points?
6. **Format-Business Match** (15%): Does the lead magnet format match the business type?

Respond in this exact JSON format:
{
  "sub_scores": [
    { "key": "lead_magnet_existence", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] },
    { "key": "offer_specificity", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] },
    { "key": "form_friction", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] },
    { "key": "bridge_to_paid", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] },
    { "key": "social_proof_at_capture", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] },
    { "key": "format_business_match", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] }
  ],
  "summary_free": "One-sentence assessment",
  "summary_gated": "Detailed 3-5 sentence analysis",
  "findings": [
    { "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "...", "playbook_chapter": "Chapter 4: Lead Capture" }
  ],
  "quick_wins": [
    { "title": "...", "description": "...", "impact": "high|medium|low", "effort": "quick|moderate|involved" }
  ]
}`;
};
