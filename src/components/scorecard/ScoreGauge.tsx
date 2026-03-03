"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";
import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  grade: string;
  size?: number;
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "var(--grade-a)";
  if (grade.startsWith("B")) return "var(--grade-b)";
  if (grade.startsWith("C")) return "var(--grade-c)";
  if (grade.startsWith("D")) return "var(--grade-d)";
  return "var(--grade-f)";
}

export function ScoreGauge({ score, grade, size = 220 }: ScoreGaugeProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const animatedScore = useCountUp({
    end: inView ? score : 0,
    duration: 1500,
    decimals: 0,
  });

  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const gradeColor = getGradeColor(grade);

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`GTM score: ${score} out of 100, grade ${grade}`}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--sylva-800)"
          strokeWidth={strokeWidth}
          opacity={0.5}
        />

        {/* Score arc — solid color, no gradient */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={gradeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: inView
              ? circumference - (circumference * score) / 100
              : circumference,
          }}
          transition={{ duration: 1.5, ease: "easeOut" as const }}
        />
      </svg>

      {/* Center content */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <span className="font-score text-5xl font-bold text-white leading-none">
          {animatedScore}
        </span>
        <span className="font-score text-sm text-sylva-500 mt-1">/100</span>
        <span
          className="mt-2 inline-flex items-center justify-center rounded-lg px-3 py-1 text-lg font-bold"
          style={{
            color: gradeColor,
            backgroundColor: `${gradeColor}12`,
            border: `1.5px solid ${gradeColor}30`,
          }}
        >
          {grade}
        </span>
      </motion.div>
    </div>
  );
}
