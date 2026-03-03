// ---------------------------------------------------------------------------
// Industry Context — Per-dimension, per-industry scoring guidance
// Injected into Claude prompts when an industry is specified
// ---------------------------------------------------------------------------

/** Human-readable industry labels */
export const INDUSTRY_LABELS: Record<string, string> = {
  technology: 'Technology / Software',
  fintech: 'Fintech / Financial Services',
  healthcare: 'Healthcare / Biotech',
  ecommerce_retail: 'E-Commerce / Retail',
  education: 'Education / EdTech',
  real_estate: 'Real Estate / PropTech',
  legal: 'Legal / Compliance',
  marketing: 'Marketing / Agencies',
  hr_recruiting: 'HR / Recruiting',
  manufacturing: 'Manufacturing / Industrial',
  nonprofit: 'Nonprofit / Social Impact',
  media: 'Media / Entertainment',
  other: '',
};

type Dimension = 'positioning' | 'copy' | 'seo' | 'lead_capture' | 'visual';

/**
 * Per-dimension, per-industry scoring guidance injected into Claude prompts.
 * Only dimensions with meaningful industry-specific criteria are included.
 */
const INDUSTRY_CONTEXT: Record<string, Partial<Record<Dimension, string>>> = {
  technology: {
    positioning: 'Evaluate developer-facing messaging, technical credibility, and integration ecosystem positioning.',
    copy: 'Look for technical accuracy balanced with accessibility. Check for jargon overuse vs. clarity for decision-makers.',
    seo: 'Consider developer documentation, API reference pages, and technical blog content as SEO signals.',
    lead_capture: 'Evaluate free tier/trial offerings, developer sandbox access, and documentation-gated content.',
    visual: 'Assess product screenshots, architecture diagrams, and dashboard previews for clarity and professionalism.',
  },
  fintech: {
    positioning: 'Evaluate security trust signals, regulatory compliance mentions (SOC 2, PCI DSS), and financial credibility indicators.',
    copy: 'Look for compliance-safe language, risk disclaimers, and trust-building specificity around financial outcomes.',
    seo: 'Consider financial content E-E-A-T requirements, regulatory keyword targeting, and educational content depth.',
    lead_capture: 'Look for trust-first CTAs (security badges, certifications) before conversion elements. Evaluate compliance of data collection.',
    visual: 'Assess security badge placement, professional imagery, and avoidance of get-rich-quick visual patterns.',
  },
  healthcare: {
    positioning: 'Pay special attention to regulatory compliance language, HIPAA trust signals, and clinical validation claims.',
    copy: 'Evaluate clinical accuracy, patient-friendly language, and regulatory disclaimer presence. Check for unsubstantiated health claims.',
    seo: 'Consider YMYL (Your Money Your Life) content standards, medical E-E-A-T requirements, and health schema markup.',
    lead_capture: 'Evaluate HIPAA-compliant form handling, patient privacy messaging, and professional credential gating.',
    visual: 'Assess clinical imagery quality, patient diversity representation, and medical credibility signals.',
  },
  ecommerce_retail: {
    positioning: 'Evaluate product differentiation, brand story, and value proposition against direct-to-consumer competitors.',
    copy: 'Look for product description quality, benefit-driven copy, urgency/scarcity language, and return policy clarity.',
    seo: 'Consider product schema markup, category page optimization, shopping intent keywords, and review/rating structured data.',
    lead_capture: 'Evaluate email popup strategy, discount-for-signup offers, cart abandonment recovery, and wishlist features.',
    visual: 'Assess product photography quality, lifestyle imagery, 360-degree views, and user-generated content integration.',
  },
  education: {
    positioning: 'Evaluate learning outcome promises, credential value proposition, and instructor/institution credibility.',
    copy: 'Look for curriculum clarity, student success stories, and outcome-specific language. Avoid vague transformation promises.',
    seo: 'Consider course schema markup, educational content depth, and topic authority building through free content.',
    lead_capture: 'Evaluate free lesson/module offerings, course preview access, and community trial membership.',
    visual: 'Assess course preview quality, instructor presentation, student testimonial videos, and platform UI clarity.',
  },
  real_estate: {
    positioning: 'Evaluate local market expertise signals, property type specialization, and agent/brand differentiation.',
    copy: 'Look for neighborhood expertise, market data citations, and property description quality. Check for MLS compliance.',
    seo: 'Consider local SEO optimization, property listing schema, neighborhood content, and geographic keyword targeting.',
    lead_capture: 'Evaluate property alert signups, home valuation tools, and consultation booking flows.',
    visual: 'Assess property photography quality, virtual tour integration, map/neighborhood visuals, and agent headshots.',
  },
  legal: {
    positioning: 'Evaluate practice area specialization, case result specificity, and attorney credential prominence.',
    copy: 'Look for authority signals, credentials, bar admissions, and case result specificity. Check for ethical compliance in claims.',
    seo: 'Consider legal content E-E-A-T requirements, practice area content depth, and local SEO for jurisdiction targeting.',
    lead_capture: 'Evaluate free consultation offers, case evaluation forms, and urgency messaging for time-sensitive legal matters.',
    visual: 'Assess professional headshots, office photography, and trust-building visual elements (awards, credentials).',
  },
  marketing: {
    positioning: 'Evaluate specialization clarity, methodology differentiation, and proof of results for client businesses.',
    copy: 'Look for client result specificity, ROI language, and demonstration of marketing expertise through the site itself.',
    seo: 'Consider content marketing depth, thought leadership content, and demonstration of SEO expertise on their own site.',
    lead_capture: 'Evaluate audit/assessment lead magnets, case study gating, and free strategy session offers.',
    visual: 'Assess portfolio quality, client logo walls, before/after case study visuals, and brand sophistication.',
  },
  hr_recruiting: {
    positioning: 'Evaluate employer brand messaging, candidate value proposition, and industry specialization signals.',
    copy: 'Look for inclusive language, culture communication, and specific role/outcome language vs. generic career messaging.',
    seo: 'Consider job schema markup, career page optimization, and employer brand content depth.',
    lead_capture: 'Evaluate job alert signups, talent network registration, and employer inquiry forms.',
    visual: 'Assess workplace photography, team diversity representation, and culture-showcasing visuals.',
  },
  manufacturing: {
    positioning: 'Evaluate technical capability claims, quality certification prominence, and supply chain positioning.',
    copy: 'Look for specification accuracy, technical detail depth, and industry compliance language.',
    seo: 'Consider product catalog SEO, technical specification pages, and industry directory presence.',
    lead_capture: 'Evaluate RFQ (Request for Quote) forms, catalog download gates, and technical consultation offers.',
    visual: 'Assess facility photography, product detail images, process documentation visuals, and certification badges.',
  },
  nonprofit: {
    positioning: 'Evaluate mission clarity, impact quantification, and donor value proposition differentiation.',
    copy: 'Look for impact storytelling, transparency language, and emotional appeal balanced with data-driven proof.',
    seo: 'Consider cause-related content depth, impact report indexing, and nonprofit schema markup.',
    lead_capture: 'Evaluate donation flow optimization, volunteer signup forms, newsletter engagement, and impact report gating.',
    visual: 'Assess beneficiary photography (ethical representation), impact infographics, and event documentation.',
  },
  media: {
    positioning: 'Evaluate content niche clarity, editorial voice differentiation, and audience segment specificity.',
    copy: 'Look for editorial quality, headline craft, and content preview effectiveness for subscription conversion.',
    seo: 'Consider news/article schema markup, content freshness signals, and topic cluster strategy.',
    lead_capture: 'Evaluate paywall strategy, newsletter signup placement, and content preview optimization.',
    visual: 'Assess featured imagery quality, video content production value, and responsive media player integration.',
  },
};

/**
 * Get industry-specific scoring guidance for a given dimension.
 * Returns empty string if no specific guidance exists.
 */
export function getIndustryContext(
  industry: string | undefined,
  dimension: Dimension,
): string {
  if (!industry || industry === 'other' || !INDUSTRY_CONTEXT[industry]) {
    return '';
  }
  return INDUSTRY_CONTEXT[industry][dimension] ?? '';
}

/**
 * Build an industry context line for injection into Claude prompts.
 * Returns empty string if no industry is set.
 */
export function buildIndustryLine(industry?: string): string {
  if (!industry || industry === 'other') return '';
  const label = INDUSTRY_LABELS[industry];
  if (!label) return '';
  return ` in the ${label} industry`;
}
