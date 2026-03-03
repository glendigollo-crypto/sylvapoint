"use client";

import { useState } from "react";
import { ScoreGauge } from "@/components/scorecard/ScoreGauge";
import { DimensionBar } from "@/components/scorecard/DimensionBar";
import { GapCard } from "@/components/scorecard/GapCard";
import { EmailGateModal } from "@/components/gate/EmailGateModal";
import { ShareButton } from "@/components/shared/ShareButton";
import { DIMENSION_LABELS } from "@/lib/utils/constants";
import Link from "next/link";

interface AuditResultsProps {
  slug: string;
  initialData: {
    audit_id: string;
    share_slug: string;
    url: string;
    business_type: string;
    status: string;
    tier?: string;
    composite_score?: number;
    top_gaps?: Array<{
      dimension_key: string;
      label: string;
      score: number;
      grade: string;
      quick_win: string;
    }>;
    dimension_scores?: Array<{
      dimension: string;
      label: string;
      score: number;
      grade: string;
      summaryFree?: string;
      summaryGated?: string;
      findings?: Array<{
        title: string;
        severity: string;
        evidence: string;
        recommendation: string;
      }>;
      quickWins?: Array<{
        title: string;
        description: string;
        impact: string;
        effort: string;
      }>;
    }>;
    error_message?: string;
  };
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

const DIMENSION_WEIGHTS: Record<string, number> = {
  positioning: 0.18,
  copy: 0.15,
  seo: 0.15,
  lead_capture: 0.15,
  performance: 0.12,
  visual: 0.25,
};

export function AuditResults({ slug, initialData }: AuditResultsProps) {
  const [data, setData] = useState(initialData);
  const [isUnlocked, setIsUnlocked] = useState(
    data.tier === "gated" || data.tier === "paid"
  );

  const score = Math.round(data.composite_score ?? 0);
  const grade = getGradeFromScore(score);

  if (data.status !== "completed") {
    return (
      <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4">
        <div className="text-center">
          {data.status === "failed" ? (
            <>
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Audit Failed
              </h2>
              <p className="text-sylva-300 mb-6">
                {data.error_message || "Something went wrong."}
              </p>
              <Link
                href="/audit"
                className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-sylva-950 hover:bg-amber-400"
              >
                Try Again
              </Link>
            </>
          ) : (
            <>
              <div className="animate-spin text-2xl text-amber-500 mb-4">
                ⟳
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Audit In Progress
              </h2>
              <p className="text-sylva-300">
                Your audit is still being processed. Check back shortly.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleUnlock = async () => {
    // Re-fetch the audit data with gated content
    try {
      const res = await fetch(`/api/audit/${slug}`);
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
        setIsUnlocked(true);
      }
    } catch {
      // Silently fail — data was already unlocked server-side
      setIsUnlocked(true);
    }
  };

  const gaps = data.top_gaps ?? [];
  const dimensions = data.dimension_scores ?? [];
  const totalFindings = dimensions.reduce(
    (acc, d) => acc + (d.findings?.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-sylva-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-sylva-950 to-sylva-900 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-white">
              SylvaPoint
            </Link>
            <ShareButton url={`/audit/${slug}`} score={score} grade={grade} />
          </div>
          <p className="mt-4 text-sm text-sylva-400">
            GTM Audit for{" "}
            <span className="text-sylva-200">{data.url}</span>
          </p>
        </div>
      </div>

      {/* Score Section */}
      <div className="px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-white mb-8">
            Your GTM Scorecard
          </h1>
          <ScoreGauge score={score} grade={grade} size={220} />

          <p className="mt-6 text-sylva-300 max-w-lg mx-auto">
            Your overall GTM readiness score is{" "}
            <span className="text-white font-bold">{score}/100</span>
            {" "}({grade}).
            {gaps.length > 0 && (
              <>
                {" "}Your biggest gap is in{" "}
                <span className="text-amber-400">{gaps[0].label}</span>.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Dimension Bars */}
      <div className="px-4 pb-12">
        <div className="mx-auto max-w-2xl space-y-5">
          {(dimensions.length > 0
            ? dimensions.map((d) => ({
                key: d.dimension,
                label: d.label,
                score: d.score,
                grade: d.grade,
                weight: DIMENSION_WEIGHTS[d.dimension] ?? 0.15,
              }))
            : Object.entries(DIMENSION_LABELS).map(([key, label]) => ({
                key,
                label,
                score: 50,
                grade: "D+",
                weight: DIMENSION_WEIGHTS[key] ?? 0.15,
              }))
          ).map((dim, index) => (
            <DimensionBar
              key={dim.key}
              label={dim.label}
              score={dim.score}
              grade={dim.grade}
              weight={dim.weight}
              delay={index * 200}
            />
          ))}
        </div>
      </div>

      {/* Top Gaps */}
      {gaps.length > 0 && (
        <div className="px-4 pb-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-bold text-white mb-6">
              Top 3 Gaps
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {gaps.map((gap, index) => (
                <GapCard
                  key={gap.dimension_key}
                  rank={index + 1}
                  dimensionLabel={gap.label}
                  score={gap.score}
                  grade={gap.grade}
                  quickWin={gap.quick_win}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gated Content / Email Gate */}
      <div className="px-4 pb-12">
        <div className="mx-auto max-w-2xl">
          {!isUnlocked ? (
            <EmailGateModal
              auditSlug={slug}
              findingsCount={totalFindings || 47}
              onUnlocked={handleUnlock}
            />
          ) : (
            <div className="space-y-8">
              {/* Unlocked dimension details */}
              {dimensions.map((dim) => (
                <div
                  key={dim.dimension}
                  className="rounded-xl border border-sylva-700 bg-sylva-900/50 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">
                      {dim.label}
                    </h3>
                    <span className="font-score text-amber-400 font-bold">
                      {Math.round(dim.score)}/100
                    </span>
                  </div>
                  {dim.summaryGated && (
                    <p className="text-sm text-sylva-300 mb-4">
                      {dim.summaryGated}
                    </p>
                  )}

                  {/* Findings */}
                  {dim.findings && dim.findings.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <h4 className="text-sm font-semibold text-sylva-200">
                        Findings
                      </h4>
                      {dim.findings.map((finding, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-sylva-800/50 p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-bold uppercase ${
                                finding.severity === "critical"
                                  ? "text-grade-f"
                                  : finding.severity === "warning"
                                  ? "text-grade-d"
                                  : "text-grade-b"
                              }`}
                            >
                              {finding.severity}
                            </span>
                            <span className="text-sm font-medium text-white">
                              {finding.title}
                            </span>
                          </div>
                          <p className="text-xs text-sylva-400">
                            {finding.evidence}
                          </p>
                          <p className="mt-1 text-xs text-amber-400">
                            → {finding.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Wins */}
                  {dim.quickWins && dim.quickWins.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-sylva-200 mb-2">
                        Quick Wins
                      </h4>
                      {dim.quickWins.map((qw, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm text-sylva-300 mb-1"
                        >
                          <span className="text-grade-a mt-0.5">✓</span>
                          <span>
                            <strong className="text-white">
                              {qw.title}
                            </strong>{" "}
                            — {qw.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* CTA: Playbook + Call */}
              <div className="grid gap-4 md:grid-cols-2">
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
          )}
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
