// Phase 2: Visual & Creative scoring prompt
// Slim "scorecard" version — scores + brief summary only.

import { buildIndustryLine, getIndustryContext } from './industry-context';

export const VISUAL_SYSTEM_PROMPT = `You are a visual design strategist. Score website visual quality quickly and accurately. Be concise.`;

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

  return `Score this ${context.businessType} company's${industryLine} visual presence.

## Images: ${context.imageCount} total, hero: ${context.hasHeroImage ? "Yes" : "No"}, alt text: ${context.imagesWithAlt}/${context.totalImages}
## Videos: ${context.videoCount} (sources: ${context.videoSources.join(", ") || "none"})

## Content Context (excerpt)
${context.bodyContent.slice(0, 1000)}

${industryGuidance ? `## Industry Notes\n${industryGuidance}\n\n` : ''}Score 0-10 each:
1. product_photography_quality (20%) — professional, custom vs stock
2. video_content_presence (20%) — demo, testimonial, explainer
3. platform_visual_compliance (20%) — responsive, proper sizing
4. brand_visual_consistency (20%) — consistent colors, typography
5. human_presence_authenticity (20%) — real people vs stock

Respond in JSON:
{
  "sub_scores": [
    { "key": "product_photography_quality", "score": 7, "evidence": "brief reason" },
    { "key": "video_content_presence", "score": 5, "evidence": "brief reason" },
    { "key": "platform_visual_compliance", "score": 8, "evidence": "brief reason" },
    { "key": "brand_visual_consistency", "score": 7, "evidence": "brief reason" },
    { "key": "human_presence_authenticity", "score": 6, "evidence": "brief reason" }
  ],
  "summary_free": "One sentence overall assessment.",
  "findings": [{ "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "..." }],
  "quick_wins": [{ "title": "...", "description": "...", "impact": "high|medium|low", "effort": "quick|moderate|involved" }]
}`;
};
