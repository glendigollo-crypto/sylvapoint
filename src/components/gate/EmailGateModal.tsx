"use client";

import { useState } from "react";

interface EmailGateModalProps {
  auditSlug: string;
  findingsCount: number;
  onUnlocked: () => void;
}

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
    <div className="rounded-xl border-2 border-amber-500/30 bg-gradient-to-b from-sylva-50 to-white p-8">
      <h3 className="text-xl font-bold text-sylva-900">
        Your audit found {findingsCount} specific findings
      </h3>
      <p className="mt-2 text-muted-foreground">
        Enter your email to unlock the full report:
      </p>

      <ul className="mt-4 space-y-2 text-sm text-sylva-700">
        {[
          "Detailed analysis per dimension",
          "Priority action items ranked by impact",
          "Real examples from YOUR site",
          "Industry benchmarks comparison",
          "5 actionable quick wins",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="text-grade-a">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 rounded-lg border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-sylva-500 focus:outline-none focus:ring-2 focus:ring-sylva-500/20"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-sylva-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {isSubmitting ? "Unlocking..." : "Unlock Report"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-grade-f">{error}</p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
