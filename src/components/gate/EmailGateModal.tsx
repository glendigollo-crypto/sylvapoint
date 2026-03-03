"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface EmailGateModalProps {
  auditSlug: string;
  findingsCount: number;
  onUnlocked: () => void;
}

const VALUE_PROPS = [
  "Detailed analysis per dimension",
  "Priority action items ranked by impact",
  "Real examples from YOUR site",
  "Industry benchmarks comparison",
  "5 actionable quick wins",
];

export function EmailGateModal({
  auditSlug,
  findingsCount,
  onUnlocked,
}: EmailGateModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/audit/${auditSlug}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to unlock report");
      }

      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      className="glass-card-strong glow-amber-subtle p-8"
    >
      {/* Findings count — large, static, no animation */}
      <div className="text-center mb-6">
        <span className="font-score text-5xl font-bold text-amber-400">
          {findingsCount}
        </span>
        <p className="text-lg font-semibold text-white mt-2">
          findings detected
        </p>
        <p className="text-sm text-sylva-400 mt-1">
          Enter your email to unlock the full report
        </p>
      </div>

      {/* Value props */}
      <ul className="space-y-2.5 mb-6">
        {VALUE_PROPS.map((item, i) => (
          <motion.li
            key={item}
            className="flex items-center gap-3 text-sm text-sylva-200"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-grade-a/15">
              <Check size={12} className="text-grade-a" />
            </span>
            {item}
          </motion.li>
        ))}
      </ul>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3" aria-label="Unlock full report">
        <label htmlFor="gate-email" className="sr-only">
          Email address
        </label>
        <input
          id="gate-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          aria-describedby={error ? "gate-error" : undefined}
          className="w-full rounded-xl border border-sylva-700 bg-sylva-900/80 px-4 py-3.5 text-white placeholder:text-sylva-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-amber-500 px-6 py-3.5 font-bold text-sylva-950 hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Unlocking..." : "Unlock Full Report"}
        </button>
      </form>

      {error && (
        <p id="gate-error" role="alert" className="mt-3 text-sm text-grade-f text-center">
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-xs text-sylva-600">
        No spam. Unsubscribe anytime.
      </p>
    </motion.div>
  );
}
