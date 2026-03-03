"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AuditFormData } from "@/types/audit";

interface UseAuditFormResult {
  isSubmitting: boolean;
  error: string | null;
  submit: (data: AuditFormData) => Promise<void>;
}

export function useAuditForm(): UseAuditFormResult {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (data: AuditFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to start audit");
      }

      const result = await response.json();
      router.push(`/audit/loading?slug=${result.share_slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, error, submit };
}
