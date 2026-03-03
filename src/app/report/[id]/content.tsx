"use client";

import { useState } from "react";
import Link from "next/link";
import { ScoreGauge } from "@/components/scorecard/ScoreGauge";
const DIMENSION_LABELS: Record<string, string> = {
  positioning: "Positioning & Messaging",
  copy: "Copy Effectiveness",
  seo: "SEO & Content Quality",
  lead_capture: "Lead Capture",
  performance: "Website Performance",
  visual: "Visual & Creative",
};

interface Finding {
  title: string;
  severity: string;
  evidence: string;
  recommendation: string;
}

interface QuickWin {
  title: string;
  description: string;
  impact: string;
  effort: string;
}

interface DimensionScore {
  dimension: string;
  label: string;
  score: number;
  grade: string;
  summaryFree?: string;
  summaryGated?: string;
  findings?: Finding[];
  quickWins?: QuickWin[];
}

interface ReportData {
  audit_id: string;
  share_slug: string;
  url: string;
  business_type: string;
  status: string;
  tier: string;
  composite_score: number;
  top_gaps?: Array<{
    dimension_key: string;
    label: string;
    score: number;
    grade: string;
    quick_win: string;
  }>;
  dimension_scores?: DimensionScore[];
}

function getGradeFromScore(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D+";
  if (score >= 45) return "D";
  if (score >= 40) return "D-";
  return "F";
}

function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-grade-f bg-red-500/10 border-red-500/20";
    case "warning":
      return "text-grade-d bg-orange-500/10 border-orange-500/20";
    default:
      return "text-grade-b bg-blue-500/10 border-blue-500/20";
  }
}

function impactBadge(impact: string): string {
  switch (impact) {
    case "high":
      return "bg-red-500/20 text-red-400";
    case "medium":
      return "bg-amber-500/20 text-amber-400";
    default:
      return "bg-green-500/20 text-green-400";
  }
}

function effortBadge(effort: string): string {
  switch (effort) {
    case "quick":
      return "bg-green-500/20 text-green-400";
    case "moderate":
      return "bg-amber-500/20 text-amber-400";
    default:
      return "bg-red-500/20 text-red-400";
  }
}

export function ReportContent({
  slug,
  data,
}: {
  slug: string;
  data: ReportData;
}) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const score = Math.round(data.composite_score ?? 0);
  const grade = getGradeFromScore(score);
  const dimensions = data.dimension_scores ?? [];
  const totalFindings = dimensions.reduce(
    (acc, d) => acc + (d.findings?.length ?? 0),
    0
  );

  // Sort dimensions by score for priority action plan
  const sortedByScore = [...dimensions].sort((a, b) => a.score - b.score);

  return (
    <div className="min-h-screen bg-sylva-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-sylva-950 to-sylva-900 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-white">
              SylvaPoint
            </Link>
            <Link
              href={`/audit/${slug}`}
              className="text-sm text-sylva-400 hover:text-white"
            >
              Back to Scorecard
            </Link>
          </div>
          <p className="mt-4 text-sm text-sylva-400">
            Full GTM Report for{" "}
            <span className="text-sylva-200">{data.url}</span>
          </p>
        </div>
      </div>

      {/* Score Overview */}
      <div className="px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreGauge score={score} grade={grade} size={180} />
            <div>
              <h1 className="text-2xl font-bold text-white">
                GTM Readiness Score:{" "}
                <span className="text-amber-400">{score}/100</span>
              </h1>
              <p className="mt-2 text-sylva-300">
                Your audit identified{" "}
                <span className="text-white font-semibold">
                  {totalFindings} findings
                </span>{" "}
                across {dimensions.length} dimensions.
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href={`/playbook/${slug}`}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-sylva-950 hover:bg-amber-400"
                >
                  Get Your Playbook
                </Link>
                <Link
                  href="/book"
                  className="rounded-lg border border-sylva-600 px-4 py-2 text-sm font-semibold text-white hover:border-sylva-500"
                >
                  Book a Call
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Action Plan */}
      <div className="px-4 pb-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-white mb-6">
            Priority Action Plan
          </h2>
          <div className="rounded-xl border border-sylva-700 bg-sylva-900/50 p-6">
            <p className="text-sm text-sylva-400 mb-4">
              Top 5 fixes ordered by impact — start here for maximum
              improvement.
            </p>
            <div className="space-y-3">
              {sortedByScore
                .flatMap((d) =>
                  (d.findings ?? [])
                    .filter((f) => f.severity === "critical")
                    .map((f) => ({ ...f, dimensionLabel: d.label }))
                )
                .slice(0, 5)
                .map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg bg-sylva-800/50 p-3"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-sylva-950 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-sylva-400 mt-0.5">
                        {item.dimensionLabel} — {item.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dimension Details */}
      <div className="px-4 pb-12">
        <div className="mx-auto max-w-5xl space-y-4">
          <h2 className="text-xl font-bold text-white mb-6">
            Dimension Details
          </h2>

          {dimensions.map((dim) => {
            const isExpanded = expandedDim === dim.dimension;
            const dimLabel =
              dim.label || DIMENSION_LABELS[dim.dimension] || dim.dimension;

            return (
              <div
                key={dim.dimension}
                className="rounded-xl border border-sylva-700 bg-sylva-900/50 overflow-hidden"
              >
                {/* Accordion header */}
                <button
                  onClick={() =>
                    setExpandedDim(isExpanded ? null : dim.dimension)
                  }
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-sylva-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-2xl font-bold font-score ${
                        dim.score >= 80
                          ? "text-grade-a"
                          : dim.score >= 60
                          ? "text-grade-b"
                          : dim.score >= 40
                          ? "text-grade-c"
                          : "text-grade-f"
                      }`}
                    >
                      {dim.grade}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {dimLabel}
                      </h3>
                      <p className="text-sm text-sylva-400">
                        {dim.score}/100 —{" "}
                        {dim.findings?.length ?? 0} findings,{" "}
                        {dim.quickWins?.length ?? 0} quick wins
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Score bar */}
                    <div className="hidden sm:block w-32 h-2 rounded-full bg-sylva-800">
                      <div
                        className={`h-full rounded-full ${
                          dim.score >= 80
                            ? "bg-grade-a"
                            : dim.score >= 60
                            ? "bg-grade-b"
                            : dim.score >= 40
                            ? "bg-grade-c"
                            : "bg-grade-f"
                        }`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <span className="text-sylva-400 text-xl">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-sylva-700 p-6 space-y-6">
                    {/* Summary */}
                    {dim.summaryGated && (
                      <div>
                        <h4 className="text-sm font-semibold text-sylva-200 mb-2">
                          Analysis
                        </h4>
                        <p className="text-sm text-sylva-300">
                          {dim.summaryGated}
                        </p>
                      </div>
                    )}

                    {/* Findings */}
                    {dim.findings && dim.findings.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-sylva-200 mb-3">
                          Findings ({dim.findings.length})
                        </h4>
                        <div className="space-y-3">
                          {dim.findings.map((finding, i) => (
                            <div
                              key={i}
                              className={`rounded-lg border p-4 ${severityColor(finding.severity)}`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold uppercase">
                                  {finding.severity}
                                </span>
                                <span className="text-sm font-medium text-white">
                                  {finding.title}
                                </span>
                              </div>
                              <p className="text-xs text-sylva-300 mb-2">
                                <span className="text-sylva-500">Evidence:</span>{" "}
                                {finding.evidence}
                              </p>
                              <p className="text-xs text-amber-400">
                                Recommendation: {finding.recommendation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Wins */}
                    {dim.quickWins && dim.quickWins.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-sylva-200 mb-3">
                          Quick Wins ({dim.quickWins.length})
                        </h4>
                        <div className="space-y-2">
                          {dim.quickWins.map((qw, i) => (
                            <div
                              key={i}
                              className="rounded-lg bg-sylva-800/50 p-3"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-white">
                                  {qw.title}
                                </span>
                                <div className="flex gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${impactBadge(qw.impact)}`}
                                  >
                                    {qw.impact} impact
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${effortBadge(qw.effort)}`}
                                  >
                                    {qw.effort}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-sylva-400">
                                {qw.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTAs */}
      <div className="px-4 pb-12">
        <div className="mx-auto max-w-5xl grid gap-4 md:grid-cols-2">
          <Link
            href={`/playbook/${slug}`}
            className="block rounded-xl bg-amber-500 p-6 text-center text-sylva-950 hover:bg-amber-400 transition-colors"
          >
            <h3 className="text-lg font-bold">Get Your GTM Playbook</h3>
            <p className="mt-1 text-sm opacity-80">
              Personalized 12-chapter action plan — $47
            </p>
          </Link>
          <Link
            href="/book"
            className="block rounded-xl border-2 border-sylva-600 p-6 text-center text-white hover:border-sylva-500 transition-colors"
          >
            <h3 className="text-lg font-bold">Book a Strategy Call</h3>
            <p className="mt-1 text-sm text-sylva-300">
              30-min free GTM consultation
            </p>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-sylva-800 py-8 px-4 text-center text-sm text-sylva-600">
        <p>
          Powered by{" "}
          <Link href="/" className="text-sylva-400 hover:text-white">
            SylvaPoint
          </Link>{" "}
          — The GTM-6 Framework
        </p>
      </footer>
    </div>
  );
}
