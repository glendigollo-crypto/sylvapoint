"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";

interface ScoreGaugeProps {
  score: number;
  grade: string;
  size?: number;
}

export function ScoreGauge({ score, grade, size = 200 }: ScoreGaugeProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const animatedScore = useCountUp({
    end: inView ? score : 0,
    duration: 1500,
    decimals: 1,
  });

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (inView ? score : 0)) / 100;

  const gradeColor = getGradeColor(grade);

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={10}
          className="text-sylva-800"
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradeColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-[1500ms] ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-score text-4xl font-bold text-white">
          {animatedScore}
        </span>
        <span
          className="mt-1 text-lg font-bold"
          style={{ color: gradeColor }}
        >
          {grade}
        </span>
      </div>
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
