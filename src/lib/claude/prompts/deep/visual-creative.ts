// Deep analysis: Visual & Creative — runs post-gate with Sonnet

import { buildIndustryLine, getIndustryContext } from '../industry-context';

export const DEEP_VISUAL_SYSTEM = `You are a visual design strategist performing a deep creative audit.
Evaluate brand identity, visual hierarchy, and creative effectiveness.
Provide specific, actionable design recommendations.`;

export const DEEP_VISUAL_USER = (ctx: {
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
  const il = buildIndustryLine(ctx.industry);
  const ig = getIndustryContext(ctx.industry, 'visual');

  return `Deep-analyze this ${ctx.businessType} company's${il} visual and creative presence.

## Images: ${ctx.imageCount} total, hero: ${ctx.hasHeroImage ? "Yes" : "No"}, alt text: ${ctx.imagesWithAlt}/${ctx.totalImages}
## Videos: ${ctx.videoCount} (sources: ${ctx.videoSources.join(", ") || "none"})

## Content Context (first 3000 chars)
${ctx.bodyContent.slice(0, 3000)}

${ig ? `## Industry Context\n${ig}\n\n` : ''}For each sub-dimension provide score, evidence, and recommendation:

1. product_photography_quality (20%) — professional, custom vs stock, quality
2. video_content_presence (20%) — demo, testimonial, explainer video
3. platform_visual_compliance (20%) — responsive, proper sizing, fast loading
4. brand_visual_consistency (20%) — consistent colors, typography, style
5. human_presence_authenticity (20%) — real people vs stock, team photos

Respond in JSON:
{
  "sub_scores": [
    { "key": "product_photography_quality", "score": 7, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "video_content_presence", "score": 5, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "platform_visual_compliance", "score": 8, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "brand_visual_consistency", "score": 7, "evidence": "detailed paragraph", "evidence_quotes": ["..."] },
    { "key": "human_presence_authenticity", "score": 6, "evidence": "detailed paragraph", "evidence_quotes": ["..."] }
  ],
  "summary_gated": "3-5 sentence deep visual analysis with specific design improvements.",
  "findings": [
    { "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "...", "playbook_chapter": "Chapter 6: Visual" }
  ],
  "quick_wins": [
    { "title": "...", "description": "specific design changes", "impact": "high|medium|low", "effort": "quick|moderate|involved" }
  ]
}`;
};
