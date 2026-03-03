"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { AuditStatus } from "@/types/audit";

/* ------------------------------------------------------------------ */
/* Step definitions — vertex maps step index → hex vertex (0-5)       */
/* ------------------------------------------------------------------ */

const STEPS = [
  { key: "crawling", label: "Crawling your website", vertex: -1 },
  { key: "positioning", label: "Analyzing positioning & messaging", vertex: 0 },
  { key: "copy", label: "Evaluating copy effectiveness", vertex: 1 },
  { key: "seo", label: "Scoring SEO & content", vertex: 2 },
  { key: "lead_capture", label: "Checking lead capture systems", vertex: 3 },
  { key: "performance", label: "Measuring website performance", vertex: 4 },
  { key: "visual", label: "Reviewing visual & creative", vertex: 5 },
  { key: "finalizing", label: "Generating your GTM scorecard", vertex: -1 },
];

const DIMENSION_LABELS = [
  "Positioning",
  "Copy",
  "SEO",
  "Lead Capture",
  "Performance",
  "Visual",
];

/* ------------------------------------------------------------------ */
/* SVG hex helpers                                                     */
/* ------------------------------------------------------------------ */

function hexVertex(cx: number, cy: number, r: number, i: number) {
  const angle = (i * 60 - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const v = hexVertex(cx, cy, r, i);
    return `${v.x},${v.y}`;
  }).join(" ");
}

/* ------------------------------------------------------------------ */
/* Wave text — each character ripples with staggered delay            */
/* ------------------------------------------------------------------ */

function WaveText({ text }: { text: string }) {
  return (
    <span className="inline-flex flex-wrap">
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block flag-char"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function AuditLoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<AuditStatus>("pending");
  const [error, setError] = useState<string | null>(null);

  // Counters derived from progress
  const pagesFound = useMemo(
    () => Math.max(1, Math.floor(progress * 0.06)),
    [progress]
  );
  const elementsAnalyzed = useMemo(
    () => Math.floor(progress * 2.4 + (progress > 20 ? progress * 0.8 : 0)),
    [progress]
  );
  const issuesDetected = useMemo(
    () => Math.floor(progress > 30 ? (progress - 30) * 0.65 : 0),
    [progress]
  );

  /* ---- Tab title animation ---- */
  useEffect(() => {
    if (status === "completed" || error) {
      document.title = "GTM Audit \u2014 SylvaPoint";
      return;
    }

    const step = STEPS[currentStep];
    let frame = 0;
    const dots = ["   ", ".  ", ".. ", "..."];

    const interval = setInterval(() => {
      frame = (frame + 1) % dots.length;
      document.title = `${step.label}${dots[frame]} | SylvaPoint`;
    }, 400);

    return () => {
      clearInterval(interval);
      document.title = "GTM Audit \u2014 SylvaPoint";
    };
  }, [currentStep, status, error]);

  /* ---- Polling ---- */
  const pollStatus = useCallback(async () => {
    if (!slug) return;

    try {
      const response = await fetch(`/api/audit/${slug}/status`);
      if (!response.ok) throw new Error("Failed to fetch status");

      const data = await response.json();
      setStatus(data.status);
      setProgress(data.progress_pct);

      const stepIndex = Math.min(
        Math.floor((data.progress_pct / 100) * STEPS.length),
        STEPS.length - 1
      );
      setCurrentStep(stepIndex);

      if (data.status === "completed") {
        router.push(`/audit/${slug}`);
      } else if (data.status === "failed") {
        setError(data.error_message || "Audit failed. Please try again.");
      }
    } catch {
      setError("Connection lost. Please refresh the page.");
    }
  }, [slug, router]);

  useEffect(() => {
    if (!slug) {
      router.push("/audit");
      return;
    }
    const interval = setInterval(pollStatus, 2000);
    pollStatus();
    return () => clearInterval(interval);
  }, [slug, pollStatus, router]);

  const remainingSeconds = useMemo(
    () => Math.max(5, Math.round(((100 - progress) / 100) * 60)),
    [progress]
  );

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center rounded-2xl border border-sylva-700 bg-sylva-900 p-8 max-w-md shadow-sm"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-grade-f/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--grade-f)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <h2 className="text-xl font-semibold text-sylva-50 mb-2">
            Audit Failed
          </h2>
          <p className="text-sylva-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/audit")}
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-sylva-950 hover:bg-amber-400 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  /* ---- Radar geometry ---- */
  const hSize = 280;
  const cx = hSize / 2;
  const cy = hSize / 2;
  const hexR = hSize * 0.38;
  const ringR = hSize * 0.44;
  const ringCirc = 2 * Math.PI * ringR;

  // Hex vertices for blips
  const vertices = Array.from({ length: 6 }, (_, i) =>
    hexVertex(cx, cy, hexR, i)
  );

  // Clip-path polygon matching the hex shape (for conic sweep)
  const clipPoly = vertices
    .map((v) => `${(v.x / hSize) * 100}% ${(v.y / hSize) * 100}%`)
    .join(", ");

  return (
    <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-sylva-50">
            Scanning{" "}
            <span className="text-amber-500">
              {slug
                ? decodeURIComponent(slug).replace(/^https?:\/\//, "")
                : "..."}
            </span>
          </h2>
          <p className="mt-2 text-sm text-sylva-400">
            Our GTM-6 engine is analyzing your site across six dimensions
          </p>
        </motion.div>

        {/* ── Radar Scanner ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-10"
        >
          <div
            className="relative rounded-full"
            style={{
              width: hSize,
              height: hSize,
              background:
                "radial-gradient(circle at center, var(--sylva-950) 0%, var(--sylva-900) 100%)",
            }}
          >
            {/* SVG hex grid + axis lines + vertex blips */}
            <svg
              width={hSize}
              height={hSize}
              viewBox={`0 0 ${hSize} ${hSize}`}
              className="absolute inset-0"
            >
              {/* Grid rings */}
              {[0.3, 0.5, 0.7].map((scale) => (
                <polygon
                  key={scale}
                  points={hexPoints(cx, cy, hexR * scale)}
                  fill="none"
                  stroke="var(--sylva-700)"
                  strokeWidth={0.5}
                  opacity={0.35}
                />
              ))}

              {/* Outer hex border */}
              <polygon
                points={hexPoints(cx, cy, hexR)}
                fill="none"
                stroke="var(--sylva-600)"
                strokeWidth={1.5}
                opacity={0.6}
              />

              {/* Axis lines from center to each vertex */}
              {vertices.map((v, i) => (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={v.x}
                  y2={v.y}
                  stroke="var(--sylva-700)"
                  strokeWidth={0.5}
                  opacity={0.3}
                />
              ))}

              {/* Dimension labels at vertices */}
              {vertices.map((v, i) => {
                const labelR2 = hexR + 20;
                const lv = hexVertex(cx, cy, labelR2, i);
                const anchor =
                  lv.x < cx - 5 ? "end" : lv.x > cx + 5 ? "start" : "middle";
                return (
                  <text
                    key={i}
                    x={lv.x}
                    y={lv.y}
                    textAnchor={anchor}
                    dominantBaseline="central"
                    className="fill-sylva-500 text-[9px] font-medium uppercase tracking-wider"
                  >
                    {DIMENSION_LABELS[i]}
                  </text>
                );
              })}

              {/* Vertex blips — base dots */}
              {vertices.map((v, i) => {
                const dimStep = i + 1; // steps 1-6 map to vertices 0-5
                const isActive = currentStep === dimStep;
                const isCompleted = currentStep > dimStep;

                return (
                  <g key={`blip-${i}`}>
                    {/* Base dot */}
                    <circle
                      cx={v.x}
                      cy={v.y}
                      r={3.5}
                      fill={
                        isCompleted
                          ? "var(--grade-a)"
                          : isActive
                          ? "var(--amber-500)"
                          : "var(--sylva-700)"
                      }
                      opacity={isCompleted || isActive ? 1 : 0.5}
                      className="transition-all duration-500"
                    />

                    {/* Active ping ring */}
                    {isActive && (
                      <circle
                        cx={v.x}
                        cy={v.y}
                        r={3.5}
                        fill="none"
                        stroke="var(--amber-500)"
                        strokeWidth={1.5}
                        className="radar-ping"
                        style={{ transformOrigin: `${v.x}px ${v.y}px` }}
                      />
                    )}

                    {/* Completed ring */}
                    {isCompleted && (
                      <circle
                        cx={v.x}
                        cy={v.y}
                        r={5.5}
                        fill="none"
                        stroke="var(--grade-a)"
                        strokeWidth={1}
                        opacity={0.4}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Conic gradient sweep beam — clipped to hex shape */}
            <motion.div
              className="absolute inset-0 pointer-events-none radar-sweep-beam"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ clipPath: `polygon(${clipPoly})` }}
            />

            {/* Sweep leading edge — thin bright line */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center center" }}
            >
              <div
                className="absolute left-1/2 top-1/2 origin-bottom"
                style={{
                  width: "1.5px",
                  height: hexR,
                  transform: "translateX(-50%) translateY(-100%)",
                  background:
                    "linear-gradient(to top, transparent 0%, rgba(255,77,77,0.15) 30%, rgba(255,77,77,0.6) 100%)",
                }}
              />
            </motion.div>

            {/* Center: progress % */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={Math.round(progress)}
                  initial={{ opacity: 0.6, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-score text-4xl font-bold text-sylva-50"
                >
                  {Math.round(progress)}%
                </motion.span>
              </AnimatePresence>
              <span className="text-[10px] text-sylva-500 mt-1 uppercase tracking-widest">
                scanning
              </span>
            </div>

            {/* Circular progress ring */}
            <svg
              width={hSize}
              height={hSize}
              className="absolute inset-0 -rotate-90"
            >
              <circle
                cx={cx}
                cy={cy}
                r={ringR}
                fill="none"
                stroke="var(--sylva-800)"
                strokeWidth={2}
                opacity={0.3}
              />
              <circle
                cx={cx}
                cy={cy}
                r={ringR}
                fill="none"
                stroke="var(--amber-500)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringCirc - (ringCirc * progress) / 100}
                className="transition-all duration-700 ease-out"
                opacity={0.8}
              />
            </svg>
          </div>
        </motion.div>

        {/* ── Live Counters ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3 mb-10"
        >
          {[
            { label: "Pages Found", value: pagesFound },
            { label: "Elements Analyzed", value: elementsAnalyzed },
            { label: "Issues Flagged", value: issuesDetected },
          ].map((counter) => (
            <div
              key={counter.label}
              className="text-center rounded-xl border border-sylva-800 bg-sylva-900/60 py-3.5 px-2"
            >
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={counter.value}
                  initial={{ opacity: 0.5, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-score text-xl font-bold text-amber-500 block"
                >
                  {counter.value}
                </motion.span>
              </AnimatePresence>
              <span className="text-[10px] text-sylva-500 uppercase tracking-wider">
                {counter.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ── Step List ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-0.5"
        >
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive =
              index === currentStep && status !== "completed";
            const isPending = !isCompleted && !isActive;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.06, duration: 0.3 }}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors duration-300 ${
                  isActive
                    ? "bg-amber-500/[0.06] border border-amber-500/20"
                    : "border border-transparent"
                }`}
              >
                {/* Indicator */}
                <span className="w-6 flex justify-center shrink-0">
                  {isCompleted ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 15,
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-grade-a/15"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className="text-grade-a"
                      >
                        <motion.path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        />
                      </svg>
                    </motion.span>
                  ) : isActive ? (
                    <span className="relative flex h-3 w-3">
                      <span className="radar-dot-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-50" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                    </span>
                  ) : (
                    <span className="block w-1.5 h-1.5 rounded-full bg-sylva-700/50" />
                  )}
                </span>

                {/* Label */}
                <span
                  className={`text-sm leading-snug ${
                    isActive
                      ? "text-sylva-50 font-medium"
                      : isCompleted
                      ? "text-sylva-400"
                      : "text-sylva-600"
                  }`}
                >
                  {isActive ? (
                    <WaveText text={step.label} />
                  ) : isCompleted ? (
                    <span className="line-through decoration-sylva-700/40">
                      {step.label}
                    </span>
                  ) : (
                    step.label
                  )}
                </span>

                {/* Active step trailing cursor */}
                {isActive && (
                  <motion.span
                    className="ml-auto shrink-0 w-[2px] h-4 rounded-full bg-amber-500"
                    animate={{ opacity: [1, 0.2] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Time estimate ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-xs text-sylva-500"
        >
          ~{remainingSeconds}s remaining
        </motion.p>
      </div>
    </div>
  );
}
