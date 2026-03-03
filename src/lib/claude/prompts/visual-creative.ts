// Phase 2: Visual & Creative scoring prompt
// Encodes VISUAL_INTELLIGENCE.md rubric

import { buildIndustryLine, getIndustryContext } from './industry-context';

export const VISUAL_SYSTEM_PROMPT = `You are a visual design and creative strategist scoring website visual quality and brand identity.

You evaluate based on:
- Product photography quality and professionalism
- Video content presence and integration
- Platform visual compliance (responsive, proper sizing)
- Brand visual consistency (colors, typography, imagery style)
- Human presence and authenticity (real people vs stock)

Score each sub-dimension 0-10 with specific evidence from the provided content analysis.`;

export const VISUAL_USER_PROMPT = (context: {
  businessType: string;
  industry?: string;
  imageCount: number;
  videoCount: number;
  hasHeroImage: boolean;
  imagesWithAlt: number;
  totalImages: number;
  videoSources: string[];
  bodyContent: string;
}) => {
  const industryLine = buildIndustryLine(context.industry);
  const industryGuidance = getIndustryContext(context.industry, 'visual');

  return `Analyze this ${context.businessType} company's${industryLine} visual and creative presence.

## Image Analysis
- Total images: ${context.imageCount}
- Hero image present: ${context.hasHeroImage ? "Yes" : "No"}
- Images with alt text: ${context.imagesWithAlt}/${context.totalImages}

## Video Analysis
- Videos found: ${context.videoCount}
- Sources: ${context.videoSources.join(", ") || "None"}

## Page Content Context (first 2000 chars)
${context.bodyContent.slice(0, 2000)}

${industryGuidance ? `## Industry-Specific Guidance\n${industryGuidance}\n\n` : ''}Score:
1. **Product Photography Quality** (20%): Professional images? Custom vs stock?
2. **Video Content Presence** (20%): Any video? Demo, testimonial, explainer?
3. **Platform Visual Compliance** (20%): Responsive images? Proper sizing? Fast loading?
4. **Brand Visual Consistency** (20%): Consistent color scheme, typography, imagery style?
5. **Human Presence & Authenticity** (20%): Real people? Team photos? Customer faces?

Respond in JSON with same structure as positioning prompt.`;
};
