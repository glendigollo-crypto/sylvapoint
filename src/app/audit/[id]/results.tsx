"use client";

import { useState, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ScoreGauge } from "@/components/scorecard/ScoreGauge";
import { RadarChart } from "@/components/scorecard/RadarChart";
import { DimensionCard } from "@/components/scorecard/DimensionCard";
import { GapCard } from "@/components/scorecard/GapCard";
import { EmailGateModal } from "@/components/gate/EmailGateModal";
import { ShareButton } from "@/components/shared/ShareButton";
import Link from "next/link";
import {
  Target,
  PenTool,
  Search,
  Magnet,
  Gauge,
  Eye,
} from "lucide-react";

interface AuditResultsProps {
  slug: string;
  initialData: {
    audit_id: string;
    share_slug: string;
    url: string;
    business_type: string;
    competitor_url?: string | null;
    status: string;
    tier?: string;
    composite_score?: number;
    top_gaps?: Array<{
      dimension_key: string;
      label: string;
      score: number;
      grade: string;
      quick_win: string;
      quick_win_description?: string;
      summary_free?: string;
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
    findings_count?: number;
    teaser_findings?: Array<{
      title: string;
      severity: string;
      dimension_label: string;
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

function getGradeColorCSS(grade: string): string {
  if (grade.startsWith("A")) return "var(--grade-a)";
  if (grade.startsWith("B")) return "var(--grade-b)";
  if (grade.startsWith("C")) return "var(--grade-c)";
  if (grade.startsWith("D")) return "var(--grade-d)";
  return "var(--grade-f)";
}

const DIMENSION_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  positioning: Target,
  copy: PenTool,
  seo: Search,
  lead_capture: Magnet,
  performance: Gauge,
  visual: Eye,
};

function severityColor(severity: string): string {
  if (severity === "critical")
    return "bg-red-500/20 text-red-400 border-red-500/30";
  if (severity === "warning")
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  return "bg-blue-500/20 text-blue-400 border-blue-500/30";
}

export function AuditResults({ slug, initialData }: AuditResultsProps) {
  const [data, setData] = useState(initialData);
  const [isUnlocked, setIsUnlocked] = useState(
    data.tier === "gated" || data.tier === "paid"
  );
  const mainRef = useRef<HTMLDivElement>(null);

  const score = Math.round(data.composite_score ?? 0);
  const grade = getGradeFromScore(score);

  // Not completed state
  if (data.status !== "completed") {
    return (
      <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4">
        <div className="text-center rounded-xl border border-sylva-700 bg-sylva-900 p-8 max-w-md">
          {data.status === "failed" ? (
            <>
              <h2 className="text-xl font-semibold text-sylva-50 mb-2">
                Audit Failed
              </h2>
              <p className="text-sylva-300 mb-6">
                {data.error_message || "Something went wrong."}
              </p>
              <Link
                href="/audit"
                className="inline-block rounded-xl bg-amber-500 px-6 py-3 font-semibold text-sylva-950 hover:bg-amber-400 transition-colors"
              >
                Try Again
              </Link>
            </>
          ) : (
            <>
              <div className="text-2xl text-amber-500 mb-4 animate-spin">
                ⟳
              </div>
              <h2 className="text-xl font-semibold text-sylva-50 mb-2">
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
    try {
      const res = await fetch(`/api/audit/${slug}`);
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
        setIsUnlocked(true);
      }
    } catch {
      setIsUnlocked(true);
    }
  };

  const gaps = data.top_gaps ?? [];
  const dimensions = data.dimension_scores ?? [];
  const totalFindings = dimensions.reduce(
    (acc, d) => acc + (d.findings?.length ?? 0),
    0
  );

  // Radar chart data
  const radarDimensions = dimensions.map((d) => ({
    label: d.label.replace(/ & .*/, ""),
    score: d.score,
    grade: d.grade,
  }));

  return (
    <AuditResultsInner
      slug={slug}
      data={data}
      score={score}
      grade={grade}
      gaps={gaps}
      dimensions={dimensions}
      radarDimensions={radarDimensions}
      totalFindings={totalFindings}
      isUnlocked={isUnlocked}
      handleUnlock={handleUnlock}
      mainRef={mainRef}
    />
  );
}

/* Separated into inner component so hooks always run (no early return before them) */
function AuditResultsInner({
  slug,
  data,
  score,
  grade,
  gaps,
  dimensions,
  radarDimensions,
  totalFindings,
  isUnlocked,
  handleUnlock,
  mainRef,
}: {
  slug: string;
  data: AuditResultsProps["initialData"];
  score: number;
  grade: string;
  gaps: NonNullable<AuditResultsProps["initialData"]["top_gaps"]>;
  dimensions: NonNullable<AuditResultsProps["initialData"]["dimension_scores"]>;
  radarDimensions: Array<{ label: string; score: number; grade: string }>;
  totalFindings: number;
  isUnlocked: boolean;
  handleUnlock: () => Promise<void>;
  mainRef: React.RefObject<HTMLDivElement | null>;
}) {
  // GSAP — static sections (header, score, radar, gaps, CTAs)
  useGSAP(
    () => {
      // Header fade in
      gsap.from(".gsap-header", {
        opacity: 0,
        y: -10,
        duration: 0.5,
        ease: "power2.out",
      });

      // Score verdict — delayed reveal after gauge animation
      gsap.set(".score-verdict", { opacity: 0, y: 12 });
      gsap.to(".score-verdict", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 1.8,
        scrollTrigger: {
          trigger: ".score-verdict",
          start: "top 85%",
        },
      });

      // Section headings — clip-path wipe
      gsap.utils.toArray<HTMLElement>(".gsap-clip").forEach((el) => {
        gsap.from(el, {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
          },
        });
      });

      // Insight cards — stagger from bottom
      gsap.set(".gsap-insight", { opacity: 0, y: 20 });
      gsap.to(".gsap-insight", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".gsap-insight",
          start: "top 85%",
        },
      });

      // Gap cards — stagger from bottom
      gsap.set(".gap-card", { opacity: 0, y: 30 });
      gsap.to(".gap-card", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".gap-card",
          start: "top 85%",
        },
      });

      // Teaser finding cards — stagger
      gsap.set(".gsap-teaser", { opacity: 0, y: 20 });
      gsap.to(".gsap-teaser", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".gsap-teaser",
          start: "top 85%",
        },
      });

      // CTA cards — stagger
      gsap.set(".cta-card", { opacity: 0, y: 20 });
      gsap.to(".cta-card", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".cta-card",
          start: "top 85%",
        },
      });
    },
    { scope: mainRef }
  );

  // GSAP — dynamic section (dimension cards after unlock)
  useGSAP(
    () => {
      if (!isUnlocked) return;

      gsap.set(".dimension-card", { opacity: 0, y: 20 });
      gsap.to(".dimension-card", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".dimension-card",
          start: "top 90%",
        },
      });
    },
    { scope: mainRef, dependencies: [isUnlocked] }
  );

  return (
    <div ref={mainRef} className="min-h-screen bg-sylva-950">
      {/* A. Header */}
      <div className="mx-4 mt-4 glass-card rounded-2xl">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-sylva-400">
              GTM Audit for{" "}
              <span className="text-sylva-200 font-medium">{data.url}</span>
            </p>
            <ShareButton url={`/audit/${slug}`} score={score} grade={grade} />
          </div>
          {data.competitor_url && (
            <p className="mt-1 text-xs text-sylva-500">
              Compared against{" "}
              <span className="text-sylva-400">{data.competitor_url}</span>
            </p>
          )}
        </div>
      </div>

      {/* B. Score Reveal */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <ScoreGauge score={score} grade={grade} size={260} />

          <div className="score-verdict mt-8 max-w-lg mx-auto">
            <p className="text-lg text-sylva-300">
              Your GTM readiness is{" "}
              <span className="text-sylva-50 font-bold font-score">{score}/100</span>{" "}
              <span style={{ color: getGradeColorCSS(grade) }}>({grade})</span>
            </p>
            {gaps.length > 0 && (
              <p className="mt-2 text-sm text-sylva-400">
                Biggest gap:{" "}
                <span className="text-amber-400 font-semibold">
                  {gaps[0].label}
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* C. Radar Chart */}
      {radarDimensions.length === 6 && (
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="gsap-clip text-xl font-bold text-sylva-50 mb-8">
              The GTM-6 Breakdown
            </h2>
            <RadarChart dimensions={radarDimensions} size={380} />
          </div>
        </section>
      )}

      {/* C2. What We Found — dimension insights */}
      {dimensions.length > 0 && (
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="gsap-clip text-xl font-bold text-sylva-50 mb-6">
              What We Found
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {dimensions.map((dim) => {
                const Icon = DIMENSION_ICONS[dim.dimension] ?? Target;
                const gradeColor = getGradeColorCSS(dim.grade);
                return (
                  <div
                    key={dim.dimension}
                    className="gsap-insight rounded-xl border border-sylva-700 bg-sylva-900 p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${gradeColor}15`,
                          color: gradeColor,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-sylva-50 truncate">
                          {dim.label}
                        </h3>
                      </div>
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-bold shrink-0"
                        style={{
                          backgroundColor: `${gradeColor}20`,
                          color: gradeColor,
                          border: `1px solid ${gradeColor}40`,
                        }}
                      >
                        {dim.grade}
                      </span>
                    </div>
                    {dim.summaryFree && (
                      <p className="text-sm text-sylva-300 leading-relaxed">
                        {dim.summaryFree}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* D. Top Leaks */}
      {gaps.length > 0 && (
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="gsap-clip text-xl font-bold text-sylva-50 mb-6">
              Top {gaps.length} Revenue Leaks
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {gaps.map((gap, index) => (
                <GapCard
                  key={gap.dimension_key}
                  rank={index + 1}
                  dimensionLabel={gap.label}
                  dimensionKey={gap.dimension_key}
                  score={gap.score}
                  grade={gap.grade}
                  quickWin={gap.quick_win}
                  summaryFree={gap.summary_free}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* D2. Sample Findings (pre-gate only) */}
      {!isUnlocked && data.teaser_findings && data.teaser_findings.length > 0 && (
        <section className="px-4 pb-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="gsap-clip text-xl font-bold text-sylva-50 mb-6">
              Sample Findings
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {data.teaser_findings.map((finding, i) => (
                <div
                  key={i}
                  className="gsap-teaser rounded-xl border border-sylva-700 bg-sylva-900 p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${severityColor(finding.severity)}`}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-xs text-sylva-500">
                      {finding.dimension_label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-sylva-50">
                    {finding.title}
                  </p>
                  <p className="mt-2 text-xs italic text-sylva-500">
                    Unlock report for details &amp; recommendations
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* D3. Findings count callout (pre-gate only) */}
      {!isUnlocked && (data.findings_count ?? totalFindings) > 0 && (
        <section className="px-4 pb-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg text-sylva-400">
              We detected{" "}
              <span className="font-score font-bold text-amber-400">
                {data.findings_count ?? totalFindings}
              </span>{" "}
              findings across{" "}
              <span className="font-score font-bold text-amber-400">
                {dimensions.length}
              </span>{" "}
              dimensions
            </p>
          </div>
        </section>
      )}

      {/* E. Email Gate / Unlocked Content */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          {!isUnlocked ? (
            <EmailGateModal
              auditSlug={slug}
              findingsCount={data.findings_count ?? totalFindings}
              onUnlocked={handleUnlock}
            />
          ) : (
            <div className="space-y-4">
              {dimensions.map((dim) => (
                <DimensionCard
                  key={dim.dimension}
                  dimension={dim.dimension}
                  label={dim.label}
                  score={dim.score}
                  grade={dim.grade}
                  summaryFree={dim.summaryFree}
                  summaryGated={dim.summaryGated}
                  findings={dim.findings}
                  quickWins={dim.quickWins}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* F. CTAs */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-3xl grid gap-4 md:grid-cols-2">
          <Link
            href={`/playbook/${slug}`}
            className="cta-card block rounded-2xl bg-amber-500 p-6 text-center text-sylva-950 hover:bg-amber-400 transition-colors btn-lift"
          >
            <h3 className="text-lg font-bold">Get Your GTM Playbook</h3>
            <p className="mt-1 text-sm opacity-75">
              Personalized 12-chapter action plan
            </p>
            <span className="mt-3 inline-block rounded-full bg-sylva-950/15 px-3 py-1 text-xs font-bold">
              $47
            </span>
          </Link>
          <Link
            href="/book"
            className="cta-card block rounded-2xl border border-sylva-600 bg-sylva-900 p-6 text-center text-sylva-50 hover:border-sylva-400 transition-colors btn-lift"
          >
            <h3 className="text-lg font-bold">Book a Strategy Call</h3>
            <p className="mt-1 text-sm text-sylva-300">
              30-min free GTM consultation
            </p>
            <span className="mt-3 inline-block rounded-full bg-sylva-800 px-3 py-1 text-xs font-bold text-sylva-300">
              Free
            </span>
          </Link>
        </div>
      </section>

      {/* Footer spacing */}
      <div className="h-8" />
    </div>
  );
}
