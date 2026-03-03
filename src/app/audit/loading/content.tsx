"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { AuditStatus } from "@/types/audit";

const STEPS = [
  { key: "crawling", label: "Crawling your website" },
  { key: "positioning", label: "Analyzing positioning & messaging" },
  { key: "copy", label: "Evaluating copy effectiveness" },
  { key: "seo", label: "Scoring SEO & content" },
  { key: "lead_capture", label: "Checking lead capture systems" },
  { key: "performance", label: "Measuring website performance" },
  { key: "visual", label: "Reviewing visual & creative" },
  { key: "finalizing", label: "Generating your GTM scorecard" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

// Hex vertex helper (pointy-top)
function hexVertex(cx: number, cy: number, r: number, i: number) {
  const angle = (i * 60 - 90) * (Math.PI / 180);
  return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
}

function hexPath(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => hexVertex(cx, cy, r, i)).join(" ");
}

export function AuditLoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<AuditStatus>("pending");
  const [error, setError] = useState<string | null>(null);

  // Counters derived from progress
  const pagesFound = useMemo(() => Math.max(1, Math.floor(progress * 0.06)), [progress]);
  const elementsAnalyzed = useMemo(
    () => Math.floor(progress * 2.4 + (progress > 20 ? progress * 0.8 : 0)),
    [progress]
  );
  const issuesDetected = useMemo(
    () => Math.floor(progress > 30 ? (progress - 30) * 0.65 : 0),
    [progress]
  );

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

  if (error) {
    return (
      <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center rounded-xl border border-sylva-700 bg-sylva-900 p-8 max-w-md"
        >
          <h2 className="text-xl font-semibold text-sylva-50 mb-2">Audit Failed</h2>
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

  const hSize = 260;
  const hCx = hSize / 2;
  const hCy = hSize / 2;
  const hexR = (hSize / 2) * 0.82;
  const ringR = (hSize / 2) * 0.92;
  const ringCirc = 2 * Math.PI * ringR;

  return (
    <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-sylva-50">
            Scanning{" "}
            <span className="text-amber-400">
              {slug ? decodeURIComponent(slug).replace(/^https?:\/\//, "") : "..."}
            </span>
          </h2>
        </motion.div>

        {/* Central Hex Scanner — sweep line + progress ring only */}
        <div className="flex justify-center mb-8">
          <div className="relative" style={{ width: hSize, height: hSize }}>
            {/* Hex grid */}
            <svg
              width={hSize}
              height={hSize}
              viewBox={`0 0 ${hSize} ${hSize}`}
              className="absolute inset-0"
            >
              {/* Inner grid lines */}
              {[0.35, 0.55, 0.75].map((scale) => (
                <polygon
                  key={scale}
                  points={hexPath(hCx, hCy, hexR * scale)}
                  fill="none"
                  stroke="var(--sylva-700)"
                  strokeWidth={0.6}
                  opacity={0.2}
                />
              ))}
              {/* Outer hex border */}
              <polygon
                points={hexPath(hCx, hCy, hexR)}
                fill="none"
                stroke="var(--sylva-600)"
                strokeWidth={1.5}
                opacity={0.5}
              />
            </svg>

            {/* Radar sweep — the one animation that earns its keep */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center center" }}
            >
              <div
                className="absolute left-1/2 top-1/2 w-px origin-bottom"
                style={{
                  height: hexR,
                  transform: "translateX(-50%) translateY(-100%)",
                  background: `linear-gradient(to top, transparent, var(--amber-500))`,
                  opacity: 0.5,
                }}
              />
            </motion.div>

            {/* Center: progress % — no glow, just the number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-score text-4xl font-bold text-sylva-50">
                {Math.round(progress)}%
              </span>
              <span className="text-xs text-sylva-600 mt-1">scanning</span>
            </div>

            {/* Circular progress ring */}
            <svg
              width={hSize}
              height={hSize}
              className="absolute inset-0 -rotate-90"
            >
              <circle
                cx={hCx}
                cy={hCy}
                r={ringR}
                fill="none"
                stroke="var(--sylva-800)"
                strokeWidth={2}
                opacity={0.3}
              />
              <circle
                cx={hCx}
                cy={hCy}
                r={ringR}
                fill="none"
                stroke="var(--amber-500)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringCirc - (ringCirc * progress) / 100}
                className="transition-all duration-700 ease-out"
                opacity={0.7}
              />
            </svg>
          </div>
        </div>

        {/* Live Counters — plain bg, no glass */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Pages Found", value: pagesFound },
            { label: "Elements Analyzed", value: elementsAnalyzed },
            { label: "Issues Detected", value: issuesDetected },
          ].map((counter) => (
            <div
              key={counter.label}
              className="text-center rounded-lg border border-sylva-800 bg-sylva-900/50 py-3 px-2"
            >
              <span className="font-score text-xl font-bold text-amber-400 block">
                {counter.value}
              </span>
              <span className="text-[10px] text-sylva-600 uppercase tracking-wider">
                {counter.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1"
        >
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep && status !== "completed";
            return (
              <motion.div
                key={step.key}
                variants={itemVariants}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 ${
                  isActive ? "bg-sylva-800/40" : ""
                }`}
              >
                <span className="w-5 flex justify-center shrink-0">
                  {isCompleted ? (
                    <span className="text-grade-a text-sm">✓</span>
                  ) : isActive ? (
                    <motion.span
                      className="block w-2 h-2 rounded-full bg-amber-400"
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  ) : (
                    <span className="block w-1.5 h-1.5 rounded-full bg-sylva-700" />
                  )}
                </span>
                <span
                  className={`text-sm ${
                    isActive
                      ? "text-sylva-50 font-medium"
                      : isCompleted
                      ? "text-sylva-500 line-through"
                      : "text-sylva-700"
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Time estimate */}
        <p className="mt-6 text-center text-xs text-sylva-600">
          ~{remainingSeconds} seconds remaining
        </p>
      </div>
    </div>
  );
}
