"use client";

import { AlertTriangle } from "lucide-react";

interface GapCardProps {
  rank: number;
  dimensionLabel: string;
  dimensionKey: string;
  score: number;
  grade: string;
  quickWin: string;
  summaryFree?: string;
}

function urgencyBorder(score: number): string {
  if (score < 50) return "var(--grade-f)";
  if (score < 70) return "var(--amber-500)";
  return "var(--grade-a)";
}

const IMPACT_LINES: Record<string, string> = {
  positioning:
    "Unclear positioning makes visitors bounce before they understand your value.",
  copy: "Weak copy fails to convert interested visitors into leads or buyers.",
  seo: "Poor SEO means potential customers never find you in the first place.",
  lead_capture:
    "Missing capture points let ready-to-engage visitors slip away.",
  performance:
    "Slow load times drive away up to half of your mobile visitors.",
  visual:
    "Outdated visuals erode trust before visitors read a single word.",
};

export function GapCard({
  rank,
  dimensionLabel,
  dimensionKey,
  score,
  grade,
  quickWin,
  summaryFree,
}: GapCardProps) {
  const borderColor = urgencyBorder(score);
  const impactLine = IMPACT_LINES[dimensionKey] ?? "This area may be costing you conversions.";

  return (
    <div
      className="gap-card rounded-xl border border-sylva-700 bg-sylva-900 overflow-hidden"
      style={{ borderTopWidth: 3, borderTopColor: borderColor }}
    >
      <div className="p-5">
        {/* Header: rank badge + score */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${borderColor}15`,
              color: borderColor,
            }}
          >
            Leak {rank}
          </span>
          <span className="font-score text-2xl font-bold text-sylva-50">
            {Math.round(score)}
            <span className="text-sm text-sylva-500 font-normal ml-0.5">
              /100
            </span>
          </span>
        </div>

        {/* Dimension label + grade */}
        <h3 className="text-base font-semibold text-sylva-50">{dimensionLabel}</h3>
        <p className="mt-1 text-xs text-sylva-500">
          Grade:{" "}
          <span style={{ color: borderColor }} className="font-bold">
            {grade}
          </span>
        </p>

        {/* Explanation: 1-3 lines from summaryFree */}
        {summaryFree && (
          <p className="mt-3 text-sm text-sylva-300 leading-relaxed">
            {summaryFree}
          </p>
        )}

        {/* Impact line */}
        <div className="mt-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-400/90 leading-relaxed">
            {impactLine}
          </p>
        </div>

        {/* Vague recommendation */}
        <div className="mt-4 rounded-lg bg-sylva-800/60 p-3 border border-sylva-700/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sylva-500 mb-1">
            Where to start
          </p>
          <p className="text-sm text-sylva-200 leading-relaxed">{quickWin}</p>
        </div>
      </div>
    </div>
  );
}
