"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface BriefingGap {
  dimension_key: string;
  label: string;
  score: number;
  grade: string;
  quick_win: string;
  summary_free?: string;
}

interface IntelBriefingProps {
  gaps: BriefingGap[];
}

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "var(--grade-a)";
  if (grade.startsWith("B")) return "var(--grade-b)";
  if (grade.startsWith("C")) return "var(--grade-c)";
  if (grade.startsWith("D")) return "var(--grade-d)";
  return "var(--grade-f)";
}

export function IntelBriefing({ gaps }: IntelBriefingProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Header typewriter
      const headerChars = containerRef.current?.querySelectorAll(".briefing-char");
      if (headerChars?.length) {
        gsap.set(headerChars, { opacity: 0 });
        gsap.to(headerChars, {
          opacity: 1,
          duration: 0.05,
          stagger: 0.03,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        });
      }

      // Briefing items clip-path wipe
      gsap.set(".briefing-item", {
        clipPath: "inset(0 100% 0 0)",
        opacity: 0,
      });
      gsap.to(".briefing-item", {
        clipPath: "inset(0 0% 0 0)",
        opacity: 1,
        duration: 0.6,
        stagger: 0.2,
        ease: "power2.out",
        delay: 0.5,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
      });
    },
    { scope: containerRef }
  );

  if (gaps.length === 0) return null;

  const headerText = "INTELLIGENCE BRIEFING";

  return (
    <div ref={containerRef} className="px-4 pb-16">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-sylva-700 bg-sylva-900 overflow-hidden">
          {/* Header bar */}
          <div className="border-b border-sylva-700 px-6 py-4 flex items-center gap-3">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: "var(--amber-500)",
                boxShadow: "0 0 8px rgba(255,77,77,0.4)",
              }}
            />
            <h2 className="font-score text-sm tracking-[0.25em] text-sylva-300">
              {headerText.split("").map((char, i) => (
                <span key={i} className="briefing-char inline-block">
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </h2>
          </div>

          {/* Briefing items */}
          <div className="p-6 space-y-6">
            {gaps.map((gap, index) => (
              <div key={gap.dimension_key} className="briefing-item">
                {/* Item header */}
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-score text-xs text-sylva-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-base font-semibold text-sylva-50">
                    {gap.label}
                  </h3>
                  <span
                    className="ml-auto font-score text-sm font-bold rounded-md px-2 py-0.5"
                    style={{
                      color: gradeColor(gap.grade),
                      backgroundColor: `${gradeColor(gap.grade)}15`,
                      border: `1px solid ${gradeColor(gap.grade)}30`,
                    }}
                  >
                    {gap.grade} — {gap.score}
                  </span>
                </div>

                {/* Summary */}
                {gap.summary_free && (
                  <p className="text-sm text-sylva-300 leading-relaxed mb-3 pl-7">
                    {gap.summary_free}
                  </p>
                )}

                {/* Recommended action */}
                <div className="pl-7">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="font-score tracking-wider uppercase"
                      style={{ color: "var(--amber-500)" }}
                    >
                      Recommended Action
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-sylva-200 font-medium">
                    {gap.quick_win}
                  </p>
                </div>

                {/* Divider */}
                {index < gaps.length - 1 && (
                  <div className="mt-5 border-t border-dashed border-sylva-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
