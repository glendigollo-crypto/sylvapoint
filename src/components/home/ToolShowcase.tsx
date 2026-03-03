"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { ScoreGauge } from "@/components/scorecard/ScoreGauge";
import { RadarChart } from "@/components/scorecard/RadarChart";

const DEMO_SCORE = 72;
const DEMO_GRADE = "B";

const DEMO_DIMENSIONS = [
  { label: "Positioning", score: 78, grade: "B+" },
  { label: "Copy", score: 65, grade: "C+" },
  { label: "SEO", score: 80, grade: "B+" },
  { label: "Lead Capture", score: 55, grade: "C-" },
  { label: "Performance", score: 85, grade: "B+" },
  { label: "Visual", score: 70, grade: "B-" },
];

const DIMENSION_INFO = [
  {
    name: "Positioning & Messaging",
    desc: "Is your value proposition clear, differentiated, and targeted?",
    icon: "\u25CE",
  },
  {
    name: "Copy Effectiveness",
    desc: "Do your headlines persuade? Is your copy specific and human?",
    icon: "\u270E",
  },
  {
    name: "SEO & Content Quality",
    desc: "Can buyers find you on Google? Is your content authoritative?",
    icon: "\u2315",
  },
  {
    name: "Lead Capture",
    desc: "Are you capturing demand? Lead magnets, CTAs, and bridge offers?",
    icon: "\u229B",
  },
  {
    name: "Website Performance",
    desc: "Is your site fast, mobile-ready, accessible, and best-practice?",
    icon: "\u25C9",
  },
  {
    name: "Visual & Creative",
    desc: "Do your visuals sell? Brand consistency and professional design?",
    icon: "\u25C8",
  },
];

export function ToolShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-dim-card]", {
        opacity: 0,
        y: 30,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "[data-dim-grid]",
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div ref={containerRef} className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
            The GTM-6 Framework
          </p>
          <h2 className="text-3xl font-bold text-sylva-50">
            Six Dimensions. One Score.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Your website and social presence scored across the 6 critical
            go-to-market dimensions that determine revenue readiness.
          </p>
        </div>

        {/* Score Visualizations */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-16">
          <div className="flex flex-col items-center">
            <ScoreGauge score={DEMO_SCORE} grade={DEMO_GRADE} size={200} />
            <p className="mt-3 text-sm text-muted-foreground">
              Sample Composite Score
            </p>
          </div>
          <div className="flex flex-col items-center">
            <RadarChart dimensions={DEMO_DIMENSIONS} size={320} />
            <p className="mt-3 text-sm text-muted-foreground">
              Dimension Breakdown
            </p>
          </div>
        </div>

        {/* Dimension Cards Grid */}
        <div data-dim-grid className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DIMENSION_INFO.map((dim) => (
            <div
              key={dim.name}
              data-dim-card
              className="rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <span className="text-2xl" aria-hidden="true">
                  {dim.icon}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-sylva-50">
                {dim.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{dim.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/audit"
            className="inline-flex items-center rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-sylva-950 transition-all hover:bg-amber-400 btn-lift"
          >
            See How Your Site Scores
          </Link>
        </div>
      </div>
    </section>
  );
}
