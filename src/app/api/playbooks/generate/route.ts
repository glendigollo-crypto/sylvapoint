// ---------------------------------------------------------------------------
// Playbook Generation API — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// POST /api/playbooks/generate
// Generates a personalized GTM playbook in markdown format based on the
// completed audit results. Called internally after a successful payment.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getTenantId } from "@/lib/tenant";
import { callClaude } from "@/lib/claude/client";
import { PLAYBOOK_SYSTEM_PROMPT, PLAYBOOK_USER_PROMPT } from "@/lib/claude/prompts/playbook";
import type { DimensionKey } from "@/types/scoring";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const generateSchema = z.object({
  audit_id: z.string().min(1, { message: "audit_id is required" }),
  lead_id: z.string().min(1, { message: "lead_id is required" }),
  payment_id: z.string().min(1, { message: "payment_id is required" }),
});

// ---------------------------------------------------------------------------
// Dimension metadata
// ---------------------------------------------------------------------------

const DIMENSION_LABELS: Record<string, string> = {
  positioning: "Positioning & Messaging",
  copy: "Copy & Persuasion",
  seo: "SEO & Discoverability",
  lead_capture: "Lead Capture & CTAs",
  performance: "Performance & Speed",
  visual: "Visual & UX Design",
};

const DIMENSION_ORDER: DimensionKey[] = [
  "positioning",
  "copy",
  "seo",
  "lead_capture",
  "performance",
  "visual",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGrade(score: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const thresholds: { min: number; grade: string }[] = [
    { min: 95, grade: "A+" },
    { min: 90, grade: "A" },
    { min: 85, grade: "A-" },
    { min: 80, grade: "B+" },
    { min: 75, grade: "B" },
    { min: 70, grade: "B-" },
    { min: 65, grade: "C+" },
    { min: 60, grade: "C" },
    { min: 55, grade: "C-" },
    { min: 50, grade: "D+" },
    { min: 45, grade: "D" },
    { min: 40, grade: "D-" },
    { min: 0, grade: "F" },
  ];
  for (const t of thresholds) {
    if (clamped >= t.min) return t.grade;
  }
  return "F";
}

function gradeEmoji(grade: string): string {
  const letter = grade.charAt(0);
  switch (letter) {
    case "A":
      return "Excellent";
    case "B":
      return "Good";
    case "C":
      return "Average";
    case "D":
      return "Below Average";
    case "F":
      return "Critical";
    default:
      return "N/A";
  }
}

function severityLabel(severity: string): string {
  switch (severity) {
    case "critical":
      return "CRITICAL";
    case "warning":
      return "WARNING";
    case "info":
      return "INFO";
    default:
      return severity.toUpperCase();
  }
}

function impactLabel(impact: string): string {
  switch (impact) {
    case "high":
      return "High Impact";
    case "medium":
      return "Medium Impact";
    case "low":
      return "Low Impact";
    default:
      return impact;
  }
}

function effortLabel(effort: string): string {
  switch (effort) {
    case "quick":
      return "Quick Win (< 1 day)";
    case "moderate":
      return "Moderate (1-5 days)";
    case "involved":
      return "Involved (1-2 weeks)";
    default:
      return effort;
  }
}

// ---------------------------------------------------------------------------
// Types for DB rows
// ---------------------------------------------------------------------------

interface DimensionScoreRow {
  dimension_key: string;
  label: string;
  raw_score: number;
  grade: string;
  summary_free: string | null;
  summary_gated: string | null;
  findings: Finding[] | null;
  quick_wins: QuickWin[] | null;
}

interface Finding {
  title: string;
  severity: string;
  evidence: string;
  recommendation: string;
  playbook_chapter: string | null;
}

interface QuickWin {
  title: string;
  description: string;
  impact: string;
  effort: string;
  dimension_key: string;
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------

function generatePlaybookMarkdown(
  audit: {
    id: string;
    url: string;
    business_type: string;
    target_clients: string | null;
    composite_score: number;
    composite_grade: string;
  },
  dimensions: DimensionScoreRow[]
): string {
  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines: string[] = [];

  // -----------------------------------------------------------------------
  // Title page
  // -----------------------------------------------------------------------
  lines.push("# Your GTM Playbook");
  lines.push("");
  lines.push(`**Prepared for:** ${audit.url}`);
  lines.push(`**Business Type:** ${audit.business_type.replace("_", " ")}`);
  if (audit.target_clients) {
    lines.push(`**Target Clients:** ${audit.target_clients}`);
  }
  lines.push(`**Date:** ${now}`);
  lines.push(`**Audit ID:** ${audit.id}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // -----------------------------------------------------------------------
  // Section 1: GTM Score Summary
  // -----------------------------------------------------------------------
  lines.push("## 1. GTM Score Summary");
  lines.push("");
  lines.push(
    `Your overall GTM readiness score is **${audit.composite_score}/100** ` +
      `(Grade: **${audit.composite_grade}** - ${gradeEmoji(audit.composite_grade)}).`
  );
  lines.push("");
  lines.push("| Dimension | Score | Grade | Rating |");
  lines.push("|-----------|-------|-------|--------|");

  // Build dimension map for ordered output
  const dimMap = new Map<string, DimensionScoreRow>();
  for (const d of dimensions) {
    dimMap.set(d.dimension_key, d);
  }

  for (const key of DIMENSION_ORDER) {
    const d = dimMap.get(key);
    if (d) {
      const label = d.label || DIMENSION_LABELS[key] || key;
      lines.push(
        `| ${label} | ${Math.round(d.raw_score)}/100 | ${d.grade} | ${gradeEmoji(d.grade)} |`
      );
    }
  }
  lines.push("");

  // -----------------------------------------------------------------------
  // Per-dimension sections
  // -----------------------------------------------------------------------
  let sectionNum = 2;
  for (const key of DIMENSION_ORDER) {
    const d = dimMap.get(key);
    if (!d) continue;

    const label = d.label || DIMENSION_LABELS[key] || key;

    lines.push(`## ${sectionNum}. ${label}`);
    lines.push("");
    lines.push(
      `**Score:** ${Math.round(d.raw_score)}/100 | **Grade:** ${d.grade} (${gradeEmoji(d.grade)})`
    );
    lines.push("");

    // Summary
    if (d.summary_gated) {
      lines.push("### Overview");
      lines.push("");
      lines.push(d.summary_gated);
      lines.push("");
    } else if (d.summary_free) {
      lines.push("### Overview");
      lines.push("");
      lines.push(d.summary_free);
      lines.push("");
    }

    // Findings
    const findings = d.findings ?? [];
    if (findings.length > 0) {
      lines.push("### Findings");
      lines.push("");
      for (const f of findings) {
        lines.push(`#### [${severityLabel(f.severity)}] ${f.title}`);
        lines.push("");
        lines.push(`**Evidence:** ${f.evidence}`);
        lines.push("");
        lines.push(`**Recommendation:** ${f.recommendation}`);
        lines.push("");
      }
    }

    // Quick wins / action items
    const quickWins = d.quick_wins ?? [];
    if (quickWins.length > 0) {
      lines.push("### Action Items");
      lines.push("");
      for (let i = 0; i < quickWins.length; i++) {
        const qw = quickWins[i];
        lines.push(`${i + 1}. **${qw.title}**`);
        lines.push(`   - ${qw.description}`);
        lines.push(
          `   - ${impactLabel(qw.impact)} | ${effortLabel(qw.effort)}`
        );
        lines.push("");
      }
    }

    lines.push("---");
    lines.push("");
    sectionNum++;
  }

  // -----------------------------------------------------------------------
  // Final section: 90-Day GTM Action Plan
  // -----------------------------------------------------------------------
  lines.push(`## ${sectionNum}. Your 90-Day GTM Action Plan`);
  lines.push("");
  lines.push(
    "The following action plan is ordered by your weakest dimensions first, " +
      "so you can focus on the highest-impact improvements."
  );
  lines.push("");

  // Sort dimensions by score ascending (worst first)
  const sortedDims = [...dimensions].sort(
    (a, b) => (a.raw_score ?? 0) - (b.raw_score ?? 0)
  );

  // Collect all quick wins across dimensions, grouped into time buckets
  const quickWins: Array<{
    title: string;
    description: string;
    impact: string;
    effort: string;
    dimensionLabel: string;
    score: number;
  }> = [];

  for (const d of sortedDims) {
    const label = d.label || DIMENSION_LABELS[d.dimension_key] || d.dimension_key;
    for (const qw of d.quick_wins ?? []) {
      quickWins.push({
        title: qw.title,
        description: qw.description,
        impact: qw.impact,
        effort: qw.effort,
        dimensionLabel: label,
        score: d.raw_score,
      });
    }
  }

  // Phase 1: Days 1-30 — Quick wins (effort = quick)
  const phase1 = quickWins.filter((qw) => qw.effort === "quick");
  // Phase 2: Days 31-60 — Moderate efforts
  const phase2 = quickWins.filter((qw) => qw.effort === "moderate");
  // Phase 3: Days 61-90 — Involved projects
  const phase3 = quickWins.filter((qw) => qw.effort === "involved");

  lines.push("### Phase 1: Days 1-30 (Quick Wins)");
  lines.push("");
  if (phase1.length > 0) {
    for (const qw of phase1) {
      lines.push(
        `- [ ] **${qw.title}** (${qw.dimensionLabel}) - ${qw.description}`
      );
    }
  } else {
    lines.push("No quick-win items identified. Move to Phase 2.");
  }
  lines.push("");

  lines.push("### Phase 2: Days 31-60 (Moderate Efforts)");
  lines.push("");
  if (phase2.length > 0) {
    for (const qw of phase2) {
      lines.push(
        `- [ ] **${qw.title}** (${qw.dimensionLabel}) - ${qw.description}`
      );
    }
  } else {
    lines.push("No moderate-effort items identified. Move to Phase 3.");
  }
  lines.push("");

  lines.push("### Phase 3: Days 61-90 (Strategic Projects)");
  lines.push("");
  if (phase3.length > 0) {
    for (const qw of phase3) {
      lines.push(
        `- [ ] **${qw.title}** (${qw.dimensionLabel}) - ${qw.description}`
      );
    }
  } else {
    lines.push("No strategic projects identified at this time.");
  }
  lines.push("");

  // Summary stats
  lines.push("---");
  lines.push("");
  lines.push(
    `> **Total action items:** ${quickWins.length} | ` +
      `**Quick wins:** ${phase1.length} | ` +
      `**Moderate:** ${phase2.length} | ` +
      `**Strategic:** ${phase3.length}`
  );
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "*This playbook was generated by SylvaPoint based on an automated GTM audit " +
      `of ${audit.url}. For questions or consulting assistance, visit sylvapoint.com.*`
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // --- Parse & validate body ---
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 422 }
      );
    }

    const { audit_id, lead_id, payment_id } = parsed.data;
    const supabase = getAdminSupabase();

    // --- Verify payment exists and is completed ---
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, status")
      .eq("id", payment_id)
      .eq("audit_id", audit_id)
      .single();

    if (paymentError || !payment) {
      // Also try matching by stripe_session_id in case payment_id is the
      // Stripe session ID rather than our internal row ID
      const { data: paymentByStripe } = await supabase
        .from("payments")
        .select("id, status")
        .eq("stripe_session_id", payment_id)
        .eq("audit_id", audit_id)
        .single();

      if (!paymentByStripe) {
        return NextResponse.json(
          { error: "Payment not found for this audit" },
          { status: 404 }
        );
      }

      if (paymentByStripe.status !== "completed") {
        return NextResponse.json(
          { error: "Payment has not been completed" },
          { status: 402 }
        );
      }
    } else if (payment.status !== "completed") {
      return NextResponse.json(
        { error: "Payment has not been completed" },
        { status: 402 }
      );
    }

    // --- Fetch audit ---
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select(
        "id, url, business_type, industry, target_clients, composite_score, composite_grade, status"
      )
      .eq("id", audit_id)
      .single();

    if (auditError || !audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    if (audit.status !== "completed") {
      return NextResponse.json(
        { error: "Audit has not completed yet" },
        { status: 409 }
      );
    }

    // --- Fetch dimension scores ---
    const { data: dimensions, error: dimError } = await supabase
      .from("dimension_scores")
      .select(
        "dimension_key, label, raw_score, grade, summary_free, summary_gated, findings, quick_wins"
      )
      .eq("audit_id", audit_id)
      .order("dimension_key");

    if (dimError || !dimensions || dimensions.length === 0) {
      return NextResponse.json(
        { error: "No dimension scores found for this audit" },
        { status: 404 }
      );
    }

    // --- Check if playbook already exists ---
    const { data: existingPlaybook } = await supabase
      .from("playbooks")
      .select("id")
      .eq("audit_id", audit_id)
      .eq("lead_id", lead_id)
      .single();

    if (existingPlaybook) {
      return NextResponse.json(
        { playbook_id: existingPlaybook.id },
        { status: 200 }
      );
    }

    // --- Generate playbook markdown ---
    const templateMarkdown = generatePlaybookMarkdown(
      {
        id: audit.id,
        url: audit.url,
        business_type: audit.business_type,
        target_clients: audit.target_clients,
        composite_score: audit.composite_score ?? 0,
        composite_grade: audit.composite_grade ?? getGrade(audit.composite_score ?? 0),
      },
      dimensions as DimensionScoreRow[]
    );

    // --- Enrich with Claude strategic insights (non-fatal) ---
    let finalMarkdown = templateMarkdown;
    try {
      const dimContext = (dimensions as DimensionScoreRow[]).map((d) => ({
        key: d.dimension_key,
        label: d.label || DIMENSION_LABELS[d.dimension_key] || d.dimension_key,
        score: Math.round(d.raw_score),
        grade: d.grade,
        summaryGated: d.summary_gated,
        topFindings: (d.findings ?? []).slice(0, 3).map((f) => f.title),
        topQuickWins: (d.quick_wins ?? []).slice(0, 3).map((qw) => qw.title),
      }));

      const claudeResponse = await callClaude({
        model: "claude-sonnet-4-5-20250514",
        systemPrompt: PLAYBOOK_SYSTEM_PROMPT,
        userPrompt: PLAYBOOK_USER_PROMPT({
          businessType: audit.business_type,
          industry: audit.industry ?? undefined,
          targetClients: audit.target_clients ?? "",
          url: audit.url,
          dimensions: dimContext,
          compositeScore: audit.composite_score ?? 0,
          compositeGrade: audit.composite_grade ?? getGrade(audit.composite_score ?? 0),
        }),
        maxTokens: 3000,
        temperature: 0.4,
      });

      // Inject strategic insights between the score summary and per-dimension sections
      const insightsSection = [
        "",
        "## Strategic Insights",
        "",
        claudeResponse.content,
        "",
        "---",
        "",
      ].join("\n");

      // Insert after the first "---" (end of score summary table)
      const firstDividerIdx = finalMarkdown.indexOf("\n---\n");
      if (firstDividerIdx !== -1) {
        const afterDivider = firstDividerIdx + "\n---\n".length;
        finalMarkdown =
          finalMarkdown.slice(0, afterDivider) +
          insightsSection +
          finalMarkdown.slice(afterDivider);
      } else {
        // Fallback: prepend insights after the score summary heading
        finalMarkdown = finalMarkdown + "\n" + insightsSection;
      }
    } catch (claudeError) {
      console.error(
        "[playbooks/generate] Claude enrichment failed, using template only:",
        claudeError instanceof Error ? claudeError.message : claudeError
      );
      // finalMarkdown stays as templateMarkdown
    }

    // --- Save to playbooks table ---
    const { data: playbook, error: insertError } = await supabase
      .from("playbooks")
      .insert({
        tenant_id: getTenantId(request),
        audit_id,
        lead_id,
        payment_id,
        content_markdown: finalMarkdown,
        pdf_url: null,
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !playbook) {
      console.error("[playbooks/generate] Insert error:", insertError?.message);
      return NextResponse.json(
        { error: "Failed to save playbook" },
        { status: 500 }
      );
    }

    // --- Track analytics event ---
    await supabase.from("analytics_events").insert({
      tenant_id: getTenantId(request),
      event_type: "playbook_generated",
      audit_id,
      properties: {
        playbook_id: playbook.id,
        lead_id,
        payment_id,
        business_type: audit.business_type,
        composite_score: audit.composite_score,
      },
    });

    return NextResponse.json(
      { playbook_id: playbook.id },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "[playbooks/generate] Unexpected error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
