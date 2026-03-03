"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  PenTool,
  Search,
  Magnet,
  Gauge,
  Eye,
  ChevronDown,
} from "lucide-react";

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

interface DimensionCardProps {
  dimension: string;
  label: string;
  score: number;
  grade: string;
  summaryFree?: string;
  summaryGated?: string;
  findings?: Finding[];
  quickWins?: QuickWin[];
}

const ICONS: Record<
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

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "var(--grade-a)";
  if (grade.startsWith("B")) return "var(--grade-b)";
  if (grade.startsWith("C")) return "var(--grade-c)";
  if (grade.startsWith("D")) return "var(--grade-d)";
  return "var(--grade-f)";
}

function severityColor(severity: string): string {
  if (severity === "critical")
    return "bg-red-500/20 text-red-400 border-red-500/30";
  if (severity === "warning")
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  return "bg-blue-500/20 text-blue-400 border-blue-500/30";
}

function impactBadge(impact: string): string {
  if (impact === "high") return "bg-green-500/20 text-green-400";
  if (impact === "medium") return "bg-amber-500/20 text-amber-400";
  return "bg-sylva-700 text-sylva-300";
}

function effortBadge(effort: string): string {
  if (effort === "quick") return "bg-green-500/20 text-green-400";
  if (effort === "moderate") return "bg-amber-500/20 text-amber-400";
  return "bg-red-500/20 text-red-400";
}

export function DimensionCard({
  dimension,
  label,
  score,
  grade,
  summaryFree,
  summaryGated,
  findings = [],
  quickWins = [],
}: DimensionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const gradeColor = getGradeColor(grade);
  const Icon = ICONS[dimension] ?? Target;

  return (
    <div
      className="dimension-card rounded-xl border border-sylva-700 bg-sylva-900 overflow-hidden"
      style={{ borderLeftWidth: 3, borderLeftColor: gradeColor }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 p-5 text-left"
        aria-expanded={expanded}
        aria-label={`${label}: ${score} out of 100, grade ${grade}. Click to ${expanded ? "collapse" : "expand"} details.`}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${gradeColor}15`, color: gradeColor }}
        >
          <Icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-sylva-50 truncate">{label}</h3>
          {summaryFree && (
            <p className="mt-0.5 text-xs text-sylva-400 line-clamp-1">
              {summaryFree}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="font-score text-lg font-bold text-sylva-50">
            {Math.round(score)}
          </span>
          <span
            className="rounded-md px-2 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: `${gradeColor}20`,
              color: gradeColor,
              border: `1px solid ${gradeColor}40`,
            }}
          >
            {grade}
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} className="text-sylva-500" />
          </motion.div>
        </div>
      </button>

      {/* Expanded content — Framer Motion for height animation */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-sylva-700/50 px-5 pb-5 pt-4 space-y-5">
              {summaryGated && (
                <p className="text-sm text-sylva-300 leading-relaxed">
                  {summaryGated}
                </p>
              )}

              {findings.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-sylva-400 mb-3">
                    Findings
                  </h4>
                  <div className="space-y-2.5">
                    {findings.map((finding, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-sylva-800/50 p-3"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${severityColor(finding.severity)}`}
                          >
                            {finding.severity}
                          </span>
                          <span className="text-sm font-medium text-sylva-50">
                            {finding.title}
                          </span>
                        </div>
                        <p className="text-xs text-sylva-400 leading-relaxed">
                          {finding.evidence}
                        </p>
                        <p className="mt-1.5 text-xs text-amber-400">
                          → {finding.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {quickWins.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-sylva-400 mb-3">
                    Quick Wins
                  </h4>
                  <div className="space-y-2">
                    {quickWins.map((qw, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg bg-sylva-800/50 p-3"
                      >
                        <span className="mt-0.5 text-grade-a shrink-0">
                          ✓
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-sylva-50 font-medium">
                            {qw.title}
                          </p>
                          <p className="text-xs text-sylva-400 mt-0.5">
                            {qw.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${impactBadge(qw.impact)}`}
                            >
                              {qw.impact} impact
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${effortBadge(qw.effort)}`}
                            >
                              {qw.effort} effort
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
