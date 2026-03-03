"use client";

import { useState, useEffect, useCallback } from "react";
import type { AuditStatus, AuditStatusResponse } from "@/types/audit";

interface UseAuditPollingOptions {
  slug: string | null;
  interval?: number;
  onComplete?: (slug: string) => void;
  onError?: (error: string) => void;
}

interface UseAuditPollingResult {
  status: AuditStatus;
  progress: number;
  currentStep: string | null;
  estimatedRemaining: number | null;
  error: string | null;
  isLoading: boolean;
}

export function useAuditPolling({
  slug,
  interval = 2000,
  onComplete,
  onError,
}: UseAuditPollingOptions): UseAuditPollingResult {
  const [status, setStatus] = useState<AuditStatus>("pending");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [estimatedRemaining, setEstimatedRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const poll = useCallback(async () => {
    if (!slug) return;

    try {
      const response = await fetch(`/api/audit/${slug}/status`);
      if (!response.ok) throw new Error("Failed to fetch status");

      const data: AuditStatusResponse = await response.json();
      setStatus(data.status);
      setProgress(data.progress_pct);
      setCurrentStep(data.current_step);
      setEstimatedRemaining(data.estimated_remaining_seconds);
      setIsLoading(false);

      if (data.status === "completed") {
        onComplete?.(slug);
      } else if (data.status === "failed") {
        const msg = "Audit failed. Please try again.";
        setError(msg);
        onError?.(msg);
      }
    } catch {
      setError("Connection lost. Please refresh.");
      setIsLoading(false);
    }
  }, [slug, onComplete, onError]);

  useEffect(() => {
    if (!slug) return;

    poll();
    const timer = setInterval(poll, interval);
    return () => clearInterval(timer);
  }, [slug, interval, poll]);

  return { status, progress, currentStep, estimatedRemaining, error, isLoading };
}
