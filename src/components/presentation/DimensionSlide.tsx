"use client";

import { useRef, useEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DimensionIllustration } from "./DimensionIllustration";
import {
  Target,
  PenTool,
  Search,
  Magnet,
  Gauge,
  Eye,
} from "lucide-react";

interface SlideFinding {
  title: string;
  severity: string;
}

interface DimensionSlideProps {
  dimension: string;
  label: string;
  score: number;
  grade: string;
  summaryFree?: string;
  findings?: SlideFinding[];
  illustrationUrl?: string | null;
  index: number;
  animationMode?: "scroll" | "carousel";
  onTimelineReady?: (index: number, tl: gsap.core.Timeline) => void;
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

function gradeColorCSS(grade: string): string {
  if (grade.startsWith("A")) return "var(--grade-a)";
  if (grade.startsWith("B")) return "var(--grade-b)";
  if (grade.startsWith("C")) return "var(--grade-c)";
  if (grade.startsWith("D")) return "var(--grade-d)";
  return "var(--grade-f)";
}

function severityDotColor(severity: string): string {
  if (severity === "critical") return "var(--grade-f)";
  if (severity === "warning") return "var(--grade-d)";
  return "var(--grade-b)";
}

export function DimensionSlide({
  dimension,
  label,
  score,
  grade,
  summaryFree,
  findings = [],
  illustrationUrl,
  index,
  animationMode = "scroll",
  onTimelineReady,
}: DimensionSlideProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const Icon = DIMENSION_ICONS[dimension] ?? Target;
  const color = gradeColorCSS(grade);
  const onTimelineReadyRef = useRef(onTimelineReady);

  // Keep ref up to date
  useEffect(() => {
    onTimelineReadyRef.current = onTimelineReady;
  }, [onTimelineReady]);

  // Top 2 findings as "signal items"
  const signalItems = findings.slice(0, 2);

  useGSAP(
    () => {
      if (animationMode === "scroll") {
        // ---- SCROLL MODE (original behavior) ----
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: slideRef.current,
            start: "top 75%",
          },
        });

        tl.from(`.slide-illust-${index}`, {
          x: 60,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        });

        tl.from(
          `.slide-grade-${index}`,
          {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            ease: "back.out(1.7)",
          },
          "-=0.5"
        );

        if (scoreRef.current) {
          const counter = { val: 0 };
          tl.to(
            counter,
            {
              val: score,
              duration: 1.2,
              ease: "power2.out",
              onUpdate: () => {
                if (scoreRef.current) {
                  scoreRef.current.textContent = String(
                    Math.round(counter.val)
                  );
                }
              },
            },
            "-=0.4"
          );
        }

        tl.from(
          `.slide-label-${index}`,
          {
            clipPath: "inset(0 100% 0 0)",
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.8"
        );

        tl.from(
          `.slide-summary-${index}`,
          {
            opacity: 0,
            y: 10,
            duration: 0.4,
            ease: "power2.out",
          },
          "-=0.3"
        );

        // Illustration parallax
        gsap.to(`.slide-illust-${index}`, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: slideRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.3,
          },
        });
      } else {
        // ---- CAROUSEL MODE (paused, no ScrollTrigger) ----
        const el = slideRef.current;
        if (!el) return;

        // Set initial hidden states
        gsap.set(el.querySelector(`.slide-illust-${index}`), {
          x: 60,
          opacity: 0,
        });
        gsap.set(el.querySelector(`.slide-grade-${index}`), {
          scale: 0,
          opacity: 0,
        });
        gsap.set(el.querySelector(`.slide-label-${index}`), {
          clipPath: "inset(0 100% 0 0)",
        });
        gsap.set(el.querySelectorAll(`.slide-summary-${index}`), {
          opacity: 0,
          y: 10,
        });

        // Build paused timeline
        const tl = gsap.timeline({ paused: true });

        tl.to(el.querySelector(`.slide-illust-${index}`), {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        });

        tl.to(
          el.querySelector(`.slide-grade-${index}`),
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(1.7)",
          },
          "-=0.5"
        );

        if (scoreRef.current) {
          const scoreEl = scoreRef.current;
          scoreEl.textContent = "0";
          const counter = { val: 0 };
          tl.to(
            counter,
            {
              val: score,
              duration: 1.2,
              ease: "power2.out",
              onUpdate: () => {
                scoreEl.textContent = String(Math.round(counter.val));
              },
            },
            "-=0.4"
          );
        }

        tl.to(
          el.querySelector(`.slide-label-${index}`),
          {
            clipPath: "inset(0 0% 0 0)",
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.8"
        );

        tl.to(
          el.querySelectorAll(`.slide-summary-${index}`),
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
          },
          "-=0.3"
        );

        // Pass timeline to parent
        onTimelineReadyRef.current?.(index, tl);
      }
    },
    { scope: slideRef, dependencies: [animationMode, index, score] }
  );

  return (
    <div
      ref={slideRef}
      className={`dimension-slide relative flex flex-col md:flex-row items-stretch gap-0 ${
        animationMode === "scroll"
          ? "min-h-[85vh] scroll-snap-align-start"
          : "carousel-slide h-full overflow-hidden"
      }`}
    >
      {/* Left panel — content (60%) */}
      <div className="flex-1 md:w-[60%] flex flex-col justify-center px-6 md:px-12 py-12 order-2 md:order-1">
        {/* Dimension icon + label */}
        <div className={`slide-label-${index} flex items-center gap-3 mb-4`}>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${color}15`,
              color: color,
            }}
          >
            <Icon size={20} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-sylva-50">
            {label}
          </h2>
        </div>

        {/* Grade badge + Score */}
        <div className="flex items-baseline gap-4 mb-6">
          <div
            className={`slide-grade-${index} flex items-center justify-center rounded-2xl h-20 w-20 md:h-24 md:w-24`}
            style={{
              backgroundColor: `${color}12`,
              border: `2px solid ${color}40`,
            }}
          >
            <span
              className="text-3xl md:text-4xl font-black"
              style={{ color }}
            >
              {grade}
            </span>
          </div>
          <div>
            <span
              ref={scoreRef}
              className="font-score text-4xl md:text-5xl font-bold text-sylva-50"
            >
              0
            </span>
            <span className="font-score text-lg text-sylva-400 ml-1">
              /100
            </span>
          </div>
        </div>

        {/* Summary */}
        {summaryFree && (
          <p
            className={`slide-summary-${index} text-base text-sylva-300 leading-relaxed max-w-xl mb-6`}
          >
            {summaryFree}
          </p>
        )}

        {/* Signal items (top findings) */}
        {signalItems.length > 0 && (
          <div className={`slide-summary-${index} space-y-2`}>
            {signalItems.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: severityDotColor(f.severity),
                    boxShadow: `0 0 6px ${severityDotColor(f.severity)}`,
                  }}
                />
                <span className="text-sm text-sylva-300">{f.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel — illustration (40%) */}
      <div className="md:w-[40%] relative order-1 md:order-2 min-h-[40vh] md:min-h-0">
        <div className={`slide-illust-${index} h-full`}>
          <DimensionIllustration
            illustrationUrl={illustrationUrl}
            grade={grade}
            dimensionKey={dimension}
            className="h-full w-full rounded-none md:rounded-l-3xl"
          />
        </div>
      </div>
    </div>
  );
}
