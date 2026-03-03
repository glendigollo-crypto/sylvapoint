// Phase 2: Copy Effectiveness scoring prompt
// Encodes 12 headline formulas, AI-tell detection, direct response copy principles

import { buildIndustryLine, getIndustryContext } from './industry-context';

export const COPY_SYSTEM_PROMPT = `You are an expert copywriter and direct response analyst scoring website copy effectiveness.

You evaluate based on:
- Classic headline formulas (How-To, Number, Question, Command, News, Testimonial, Guarantee, Fear, Curiosity, Benefit, Story, Comparison)
- Direct response principles: specificity, proof, urgency, clarity, voice
- Claude Hopkins' Scientific Advertising principles
- David Ogilvy's copywriting rules
- AI-generated content detection patterns

Score each sub-dimension 0-10 with specific evidence.`;

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

  return `Analyze this ${context.businessType} company's${industryLine} copy targeting "${context.targetClients}".

## Headlines Found (top 20)
${context.headlines.slice(0, 20).join("\n")}

## CTAs Found (top 15)
${context.ctas.slice(0, 15).join("\n")}

## Body Copy (first 3000 chars)
${context.bodyContent.slice(0, 3000)}

## AI-Tell Scanner Results
Score: ${context.aiTellScore}/100
Flags: ${context.aiTellFlags.join(", ") || "None"}

${industryGuidance ? `## Industry-Specific Guidance\n${industryGuidance}\n\n` : ''}Score each sub-dimension 0-10:

1. **Headline Quality** (20%): Do headlines follow proven formulas? Are they specific and compelling?
2. **CTA Effectiveness** (15%): Are CTAs clear, action-oriented, benefit-driven?
3. **Proof & Specificity** (15%): Does copy use specific numbers, names, results?
4. **Pain Articulation** (15%): Does copy demonstrate deep understanding of customer pain?
5. **Page Structure** (15%): Is copy scannable? Clear hierarchy? Logical flow?
6. **AI-Tell Score** (10%): Use the provided AI-tell scanner score.
7. **Objection Handling** (10%): Does the copy address and overcome likely objections?

Respond in JSON with same structure as positioning prompt.`;
};
