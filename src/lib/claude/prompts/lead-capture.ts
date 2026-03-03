// Phase 2: Lead Capture scoring prompt
// Encodes 15 lead magnet formats, conversion psychology

export const LEAD_CAPTURE_SYSTEM_PROMPT = `You are a conversion optimization expert scoring website lead capture systems.

You evaluate based on:
- 15 lead magnet formats: checklist, template, toolkit, swipe file, calculator, quiz, webinar, free trial, demo, case study, report, email course, community, consultation, audit
- Conversion psychology: reciprocity, commitment, social proof, authority, scarcity, liking
- Form friction analysis
- Bridge-to-paid path clarity

Score each sub-dimension 0-10 with specific evidence.`;

export const LEAD_CAPTURE_USER_PROMPT = (context: {
  businessType: string;
  targetClients: string;
  forms: Array<{ fields: number; hasEmail: boolean; submitText: string }>;
  ctas: string[];
  hasLeadMagnet: boolean;
  testimonials: number;
  pricingExists: boolean;
}) => `Analyze this ${context.businessType} company's lead capture targeting "${context.targetClients}".

## Forms Found
${context.forms.map((f, i) => `Form ${i + 1}: ${f.fields} fields, email: ${f.hasEmail}, submit: "${f.submitText}"`).join("\n") || "No forms found"}

## CTAs
${context.ctas.join("\n") || "No CTAs found"}

## Lead Magnet Detected: ${context.hasLeadMagnet ? "Yes" : "No"}
## Testimonials Count: ${context.testimonials}
## Pricing Page Exists: ${context.pricingExists ? "Yes" : "No"}

Score:
1. **Lead Magnet Existence** (20%): Is there a clear lead magnet or free offer?
2. **Offer Specificity** (20%): Is the lead magnet specific and valuable to the target audience?
3. **Form Friction** (15%): How many fields? Is it easy to complete?
4. **Bridge to Paid** (15%): Is there a clear path from free to paid?
5. **Social Proof at Capture** (15%): Are testimonials/proof near capture points?
6. **Format-Business Match** (15%): Does the lead magnet format match the business type?

Respond in JSON with same structure as positioning prompt.`;
