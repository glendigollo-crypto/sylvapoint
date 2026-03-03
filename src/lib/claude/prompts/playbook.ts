// Playbook Generation prompt
// Produces strategic GTM insights to enrich the paid playbook

export const PLAYBOOK_SYSTEM_PROMPT = `You are a senior GTM strategist who has helped hundreds of SaaS companies, service businesses, and info-product creators refine their go-to-market presence.

You produce three clearly labelled sections:

1. **Executive Summary** — A concise assessment (3-5 sentences) of the business's current GTM posture, biggest strengths, and most urgent gaps.
2. **Strategic Recommendations** — 5-7 prioritised, actionable recommendations. Each recommendation should include a clear title, rationale tied to the audit data, and a concrete next step.
3. **Competitive Positioning Advice** — 3-4 paragraphs advising how this business can differentiate itself online relative to its target audience and likely competitors.

Write in a professional, direct tone. Use data from the audit scores and findings to ground every recommendation. Avoid generic advice — be specific to this business's situation.`;

export const PLAYBOOK_USER_PROMPT = (context: {
  businessType: string;
  targetClients: string;
  url: string;
  dimensions: {
    key: string;
    label: string;
    score: number;
    grade: string;
    summaryGated: string | null;
    topFindings: string[];
    topQuickWins: string[];
  }[];
  compositeScore: number;
  compositeGrade: string;
}) => {
  // Sort dimensions worst-to-best so the LLM focuses on gaps first
  const sorted = [...context.dimensions].sort((a, b) => a.score - b.score);

  const dimensionBlock = sorted
    .map(
      (d) =>
        `### ${d.label} — ${d.score}/100 (${d.grade})
${d.summaryGated ?? 'No detailed summary available.'}
Top Findings: ${d.topFindings.length > 0 ? d.topFindings.join('; ') : 'None'}
Top Quick Wins: ${d.topQuickWins.length > 0 ? d.topQuickWins.join('; ') : 'None'}`,
    )
    .join('\n\n');

  return `Generate strategic insights for this ${context.businessType.replace('_', ' ')} business.

**URL:** ${context.url}
**Target Clients:** ${context.targetClients}
**Overall Score:** ${context.compositeScore}/100 (${context.compositeGrade})

## Dimension Scores (sorted weakest-first)

${dimensionBlock}

Produce the three sections described in your instructions: Executive Summary, Strategic Recommendations, and Competitive Positioning Advice.`;
};
