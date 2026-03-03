"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const gradeRef = useRef<HTMLSpanElement>(null);

  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const gradeColor = getGradeColor(grade);

  useGSAP(
    () => {
      if (!arcRef.current || !numberRef.current || !gradeRef.current) return;

      // Initial state
      gsap.set(gradeRef.current, { opacity: 0, y: 6 });

      const counter = { val: 0 };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      });

      // Stroke draws and number counts up simultaneously
      tl.to(arcRef.current, {
        strokeDashoffset: circumference - (circumference * score) / 100,
        duration: 1.8,
        ease: "power2.out",
      })
        .to(
          counter,
          {
            val: score,
            duration: 1.8,
            ease: "power2.out",
            onUpdate: () => {
              if (numberRef.current) {
                numberRef.current.textContent = Math.round(
                  counter.val
                ).toString();
              }
            },
          },
          0
        ) // start at same time as stroke
        .to(
          gradeRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: "power2.out",
          },
          "-=0.5"
        );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
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
        {/* Score arc — starts fully hidden */}
        <circle
          ref={arcRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={gradeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          ref={numberRef}
          className="font-score text-5xl font-bold text-white leading-none"
        >
          0
        </span>
        <span className="font-score text-sm text-sylva-500 mt-1">/100</span>
        <span
          ref={gradeRef}
          className="mt-2 inline-flex items-center justify-center rounded-lg px-3 py-1 text-lg font-bold"
          style={{
            color: gradeColor,
            backgroundColor: `${gradeColor}12`,
            border: `1.5px solid ${gradeColor}30`,
          }}
        >
          {grade}
        </span>
      </div>
    </div>
  );
}
