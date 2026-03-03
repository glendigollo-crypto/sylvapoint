"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuditStatus } from "@/types/audit";

const STEPS = [
  { key: "crawling", label: "Crawling your website...", icon: "🌐" },
  { key: "positioning", label: "Analyzing positioning & messaging...", icon: "◎" },
  { key: "copy", label: "Evaluating copy effectiveness...", icon: "✎" },
  { key: "seo", label: "Scoring SEO & content...", icon: "⌕" },
  { key: "lead_capture", label: "Checking lead capture systems...", icon: "⊛" },
  { key: "performance", label: "Measuring website performance...", icon: "◉" },
  { key: "visual", label: "Reviewing visual & creative...", icon: "◉" },
  { key: "finalizing", label: "Generating your GTM scorecard...", icon: "📊" },
];

export function AuditLoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<AuditStatus>("pending");
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return (
      <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Audit Failed
          </h2>
          <p className="text-sylva-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/audit")}
            className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-sylva-950 hover:bg-amber-400"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h2 className="text-center text-2xl font-bold text-white mb-2">
          Analyzing Your GTM
        </h2>
        <p className="text-center text-sylva-300 mb-10">
          This takes about 60 seconds
        </p>

        <div className="mb-8 h-2 rounded-full bg-sylva-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep && status !== "completed";
            const isPending = index > currentStep;

            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-500 ${
                  isActive
                    ? "bg-sylva-800/80 text-white"
                    : isCompleted
                    ? "text-sylva-400"
                    : "text-sylva-700"
                }`}
              >
                <span className="w-6 text-center">
                  {isCompleted ? (
                    <span className="text-grade-a">✓</span>
                  ) : isActive ? (
                    <span className="inline-block animate-spin">⟳</span>
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </span>
                <span className={`text-sm ${isActive ? "font-medium" : ""}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-sylva-600">
          {status === "pending" ? "Starting analysis..." : `${progress}% complete`}
        </p>
      </div>
    </div>
  );
}
