"use client";

import { motion } from "framer-motion";

interface GapCardProps {
  rank: number;
  dimensionLabel: string;
  score: number;
  grade: string;
  quickWin: string;
  index?: number;
}

function urgencyBorder(score: number): string {
  if (score < 50) return "var(--grade-f)";
  if (score < 70) return "var(--amber-500)";
  return "var(--grade-a)";
}

export function GapCard({
  rank,
  dimensionLabel,
  score,
  grade,
  quickWin,
  index = 0,
}: GapCardProps) {
  const borderColor = urgencyBorder(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" as const }}
      className="rounded-xl border border-sylva-700 bg-sylva-900 overflow-hidden"
      style={{ borderTopWidth: 3, borderTopColor: borderColor }}
    >
      <div className="p-5">
        {/* Priority + score */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${borderColor}15`,
              color: borderColor,
            }}
          >
            Priority {rank}
          </span>
          <span className="font-score text-2xl font-bold text-white">
            {Math.round(score)}
          </span>
        </div>

        {/* Dimension label + grade */}
        <h3 className="text-base font-semibold text-white">{dimensionLabel}</h3>
        <p className="mt-1 text-xs text-sylva-500">
          Grade: <span style={{ color: borderColor }} className="font-bold">{grade}</span>
        </p>

        {/* Quick win */}
        <div className="mt-4 rounded-lg bg-sylva-800/60 p-3 border border-sylva-700/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">
            Quick Win
          </p>
          <p className="text-sm text-sylva-200 leading-relaxed">{quickWin}</p>
        </div>
      </div>
    </motion.div>
  );
}
