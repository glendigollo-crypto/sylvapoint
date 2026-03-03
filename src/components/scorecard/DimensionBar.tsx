"use client";

import { useInView } from "@/hooks/useInView";

interface DimensionBarProps {
  label: string;
  score: number;
  grade: string;
  weight: number;
  delay?: number;
}

export function DimensionBar({
  label,
  score,
  grade,
  weight,
  delay = 0,
}: DimensionBarProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const gradeColor = getGradeColor(grade);

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-score text-sm text-sylva-300">
            {score.toFixed(0)}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: `${gradeColor}20`,
              color: gradeColor,
            }}
          >
            {grade}
          </span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-sylva-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all ease-out"
          style={{
            width: inView ? `${score}%` : "0%",
            backgroundColor: gradeColor,
            transitionDuration: "1200ms",
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
      <p className="text-xs text-sylva-500">{(weight * 100).toFixed(0)}% weight</p>
    </div>
  );
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "var(--grade-a)";
  if (grade.startsWith("B")) return "var(--grade-b)";
  if (grade.startsWith("C")) return "var(--grade-c)";
  if (grade.startsWith("D")) return "var(--grade-d)";
  return "var(--grade-f)";
}
