// Phase 2: Positioning & Messaging scoring prompt
// Encodes Dunford positioning, Schwartz sophistication, Hormozi value equation frameworks

export const POSITIONING_SYSTEM_PROMPT = `You are an expert GTM analyst scoring a website's positioning and messaging.

You evaluate based on these frameworks:
- April Dunford's Obviously Awesome: competitive alternatives, unique attributes, value for customers, best-fit customers, market category
- Eugene Schwartz's Breakthrough Advertising: level of market sophistication (1-5), awareness levels
- Alex Hormozi's $100M Offers: dream outcome, perceived likelihood, time delay, effort & sacrifice

Score each sub-dimension 0-10 with specific evidence from the provided content.`;

export const POSITIONING_USER_PROMPT = (context: {
  businessType: string;
  targetClients: string;
  headlines: string[];
  bodyContent: string;
  aboutContent: string;
  pricingContent: string;
}) => `Analyze this ${context.businessType} company targeting "${context.targetClients}".

## Homepage Headlines
${context.headlines.join("\n")}

## Homepage Body
${context.bodyContent.slice(0, 3000)}

## About Page
${context.aboutContent.slice(0, 2000)}

## Pricing Page
${context.pricingContent.slice(0, 2000)}

Score each sub-dimension 0-10 and provide evidence:

1. **Transformation Clarity** (weight: 20%): How clearly do they articulate the before→after transformation?
2. **Differentiation** (weight: 20%): Can you identify what makes them different from alternatives?
3. **Value Translation** (weight: 15%): Do they translate features into outcomes?
4. **Target Specificity** (weight: 15%): How specifically defined is their ideal customer?
5. **Proof Arsenal** (weight: 15%): What proof elements exist (case studies, testimonials, data)?
6. **Mechanism Naming** (weight: 15%): Do they have a named methodology, framework, or unique mechanism?

Respond in JSON:
{
  "sub_scores": [
    { "key": "transformation_clarity", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] },
    { "key": "differentiation", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] },
    { "key": "value_translation", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] },
    { "key": "target_specificity", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] },
    { "key": "proof_arsenal", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] },
    { "key": "mechanism_naming", "score": 0-10, "evidence": "...", "evidence_quotes": ["..."] }
  ],
  "summary_free": "One-sentence assessment",
  "summary_gated": "Detailed 3-5 sentence analysis",
  "findings": [
    { "title": "...", "severity": "critical|warning|info", "evidence": "...", "recommendation": "...", "playbook_chapter": "Chapter 1: Positioning" }
  ],
  "quick_wins": [
    { "title": "...", "description": "...", "impact": "high|medium|low", "effort": "quick|moderate|involved" }
  ]
}`;
