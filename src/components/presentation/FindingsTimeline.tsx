"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Lock } from "lucide-react";

interface TimelineFinding {
  title: string;
  severity: string;
  dimension_label: string;
}

interface FindingsTimelineProps {
  findings: TimelineFinding[];
  remainingCount: number;
}

function severityDotColor(severity: string): string {
  if (severity === "critical") return "var(--grade-f)";
  if (severity === "warning") return "var(--grade-d)";
  return "var(--grade-b)";
}

function severityBorderColor(severity: string): string {
  if (severity === "critical") return "rgba(239,68,68,0.3)";
  if (severity === "warning") return "rgba(249,115,22,0.3)";
  return "rgba(59,130,246,0.3)";
}

export function FindingsTimeline({
  findings,
  remainingCount,
}: FindingsTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Timeline line draws down
      gsap.fromTo(
        ".timeline-line-inner",
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        }
      );

      // Nodes stagger in
      gsap.set(".timeline-node", { opacity: 0, x: -20 });
      gsap.to(".timeline-node", {
        opacity: 1,
        x: 0,
        duration: 0.4,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        },
      });
    },
    { scope: containerRef }
  );

  if (findings.length === 0) return null;

  return (
    <div ref={containerRef} className="px-4 pb-12">
      <div className="mx-auto max-w-2xl">
        <h2 className="gsap-clip text-xl font-bold text-sylva-50 mb-8">
          Signal Intercepts
        </h2>

        <div className="relative pl-8">
          {/* Vertical timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-sylva-700">
            <div
              className="timeline-line-inner absolute inset-0 origin-top"
              style={{
                background:
                  "linear-gradient(to bottom, var(--amber-500), var(--sylva-700))",
              }}
            />
          </div>

          {/* Finding nodes */}
          {findings.map((finding, i) => (
            <div key={i} className="timeline-node relative mb-6 last:mb-0">
              {/* Dot on line */}
              <div
                className="absolute -left-5 top-1.5 h-3 w-3 rounded-full border-2"
                style={{
                  backgroundColor: severityDotColor(finding.severity),
                  borderColor: severityBorderColor(finding.severity),
                  boxShadow: `0 0 8px ${severityBorderColor(finding.severity)}`,
                }}
              />

              {/* Content */}
              <div className="rounded-lg border border-sylva-700 bg-sylva-900 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{
                      backgroundColor: `${severityDotColor(finding.severity)}15`,
                      color: severityDotColor(finding.severity),
                      border: `1px solid ${severityBorderColor(finding.severity)}`,
                    }}
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
              </div>
            </div>
          ))}

          {/* Ghost node — locked remaining */}
          {remainingCount > 0 && (
            <div className="timeline-node relative mb-0">
              <div className="absolute -left-5 top-1.5 h-3 w-3 rounded-full border-2 border-sylva-600 bg-sylva-800 flex items-center justify-center">
                <Lock size={6} className="text-sylva-500" />
              </div>
              <div className="rounded-lg border border-dashed border-sylva-700 bg-sylva-900/50 p-4">
                <p className="text-sm text-sylva-400 italic">
                  <span className="font-score font-bold text-sylva-300">
                    {remainingCount}
                  </span>{" "}
                  more findings locked
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
