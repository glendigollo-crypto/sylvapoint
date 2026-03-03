// Phase 2: SEO & Content Quality scoring prompt
// Encodes E-E-A-T framework, readability analysis

import { buildIndustryLine, getIndustryContext } from './industry-context';

export const SEO_SYSTEM_PROMPT = `You are an SEO and content quality analyst scoring website content against Google's E-E-A-T guidelines and readability best practices.

You evaluate:
- Technical SEO signals (provided from PageSpeed data)
- Content readability (sentence length, vocabulary level, Flesch-Kincaid approximation)
- E-E-A-T signals: Experience, Expertise, Authoritativeness, Trustworthiness
- Content depth and comprehensiveness
- Content freshness indicators

Score each sub-dimension 0-10 with specific evidence.`;

export const SEO_USER_PROMPT = (context: {
  businessType: string;
  industry?: string;
  technicalSeoScore: number;
  bodyContent: string;
  headlineStructure: string[];
  hasStructuredData: boolean;
  metaDescription: string;
  isCrawlable: boolean;
}) => {
  const industryLine = buildIndustryLine(context.industry);
  const industryGuidance = getIndustryContext(context.industry, 'seo');

  return `Analyze this ${context.businessType} company's${industryLine} content quality.

## Technical SEO Score (from PageSpeed)
${context.technicalSeoScore}/100

## Meta Description
${context.metaDescription || "Not found"}

## Crawlable: ${context.isCrawlable ? "Yes" : "No"}
## Structured Data: ${context.hasStructuredData ? "Yes" : "No"}

## Headline Structure (top 25)
${context.headlineStructure.slice(0, 25).join("\n")}

## Content (first 4000 chars)
${context.bodyContent.slice(0, 4000)}

${industryGuidance ? `## Industry-Specific Guidance\n${industryGuidance}\n\n` : ''}Score:
1. **Technical SEO** (25%): Use the provided PageSpeed SEO score.
2. **Readability** (20%): Is content easy to read? Appropriate sentence length and vocabulary?
3. **E-E-A-T Signals** (20%): Evidence of experience, expertise, authoritativeness, trust?
4. **Content Depth** (20%): Is content comprehensive? Does it answer likely questions?
5. **Content Freshness** (15%): Are there date indicators? Recent content? Updated information?

Respond in JSON with same structure as positioning prompt.`;
};
