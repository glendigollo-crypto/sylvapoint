"use client";

import { useState } from "react";
import Link from "next/link";

interface AuditData {
  audit_id: string;
  share_slug: string;
  url: string;
  business_type: string;
  composite_score: number;
  top_gaps?: Array<{
    dimension_key: string;
    label: string;
    score: number;
    grade: string;
    quick_win: string;
  }>;
  dimension_scores?: Array<{
    dimension: string;
    label: string;
    score: number;
    grade: string;
  }>;
}

type PaymentTab = "stripe" | "mpesa";

function getGradeFromScore(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D+";
  if (score >= 45) return "D";
  if (score >= 40) return "D-";
  return "F";
}

const PLAYBOOK_FEATURES = [
  "Personalized analysis of your 6 GTM dimensions",
  "Specific findings with evidence from YOUR site",
  "Priority-ordered action items by impact",
  "90-day GTM improvement roadmap",
  "Quick wins you can implement today",
  "Framework-backed strategies (Dunford, Hormozi, Schwartz)",
  "Industry benchmarks for your business type",
  "Downloadable PDF + web version",
];

export function PlaybookPurchase({
  slug,
  audit,
}: {
  slug: string;
  audit: AuditData;
}) {
  const [activeTab, setActiveTab] = useState<PaymentTab>("stripe");
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const score = Math.round(audit.composite_score ?? 0);
  const grade = getGradeFromScore(score);
  const gaps = audit.top_gaps ?? [];

  const handleStripeCheckout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audit_id: audit.audit_id,
          share_slug: slug,
          product_type: "playbook_basic",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create checkout session");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number (e.g., 254712345678)");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/mpesa/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audit_id: audit.audit_id,
          share_slug: slug,
          phone_number: phone,
          product_type: "playbook_basic",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setError(null);
        alert(
          "Check your phone for the M-Pesa payment prompt. After payment, your playbook will be delivered to your email."
        );
      } else {
        setError(data.error || "Failed to initiate M-Pesa payment");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sylva-950">
      {/* Context Banner */}
      <div className="bg-gradient-to-b from-sylva-950 to-sylva-900 px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/audit/${slug}`}
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            &larr; Back to Scorecard
          </Link>
        </div>
      </div>

      {/* Context Banner */}
      <div className="px-4 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm text-sylva-400 mb-2">
            Your GTM score for{" "}
            <span className="text-sylva-200">{audit.url}</span>
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-bold font-score text-amber-400">
              {score}
            </span>
            <span className="text-2xl font-bold text-sylva-400">/100</span>
            <span
              className={`text-2xl font-bold ${
                score >= 80
                  ? "text-grade-a"
                  : score >= 60
                  ? "text-grade-b"
                  : score >= 40
                  ? "text-grade-c"
                  : "text-grade-f"
              }`}
            >
              {grade}
            </span>
          </div>
          {gaps.length > 0 && (
            <p className="mt-3 text-sm text-sylva-300">
              Your biggest gaps:{" "}
              {gaps.map((g, i) => (
                <span key={g.dimension_key}>
                  <span className="text-amber-400">{g.label}</span>
                  {i < gaps.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-12">
        <div className="mx-auto max-w-4xl grid gap-8 lg:grid-cols-2">
          {/* Left: What's Included */}
          <div>
            <h1 className="text-2xl font-bold text-sylva-50 mb-2">
              Your Personalized GTM Playbook
            </h1>
            <p className="text-sylva-300 mb-6">
              A comprehensive action plan tailored to your{" "}
              {audit.business_type.replace("_", " ")} business, based on the
              specific findings from your audit.
            </p>

            <h3 className="text-sm font-semibold text-sylva-200 mb-3 uppercase tracking-wider">
              What&apos;s Included
            </h3>
            <ul className="space-y-3 mb-8">
              {PLAYBOOK_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-grade-a mt-0.5 flex-shrink-0">
                    &#10003;
                  </span>
                  <span className="text-sylva-300">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Guarantee */}
            <div className="rounded-lg border border-sylva-700 bg-sylva-900/50 p-4">
              <p className="text-sm text-sylva-300">
                <span className="font-semibold text-sylva-50">
                  100% Money-Back Guarantee
                </span>{" "}
                — If the playbook doesn&apos;t provide actionable value for your
                GTM strategy, we&apos;ll refund you in full. No questions asked.
              </p>
            </div>
          </div>

          {/* Right: Payment */}
          <div>
            <div className="rounded-xl border border-sylva-700 bg-sylva-900/80 p-6">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-sylva-50">$47</p>
                <p className="text-sm text-sylva-400 mt-1">One-time payment</p>
              </div>

              {/* Payment Tabs */}
              <div className="flex rounded-lg bg-sylva-800 p-1 mb-6">
                <button
                  onClick={() => setActiveTab("stripe")}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    activeTab === "stripe"
                      ? "bg-sylva-700 text-sylva-50"
                      : "text-sylva-400 hover:text-sylva-50"
                  }`}
                >
                  Card / Stripe
                </button>
                <button
                  onClick={() => setActiveTab("mpesa")}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    activeTab === "mpesa"
                      ? "bg-sylva-700 text-sylva-50"
                      : "text-sylva-400 hover:text-sylva-50"
                  }`}
                >
                  M-Pesa
                </button>
              </div>

              {/* Stripe Tab */}
              {activeTab === "stripe" && (
                <div>
                  <button
                    onClick={handleStripeCheckout}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-sylva-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? "Redirecting to Stripe..." : "Pay with Card"}
                  </button>
                  <p className="text-xs text-sylva-500 text-center mt-3">
                    Secure payment via Stripe. We accept Visa, Mastercard,
                    Amex, and more.
                  </p>
                </div>
              )}

              {/* M-Pesa Tab */}
              {activeTab === "mpesa" && (
                <div>
                  <label className="block text-sm text-sylva-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="254712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-sylva-700 bg-sylva-800 px-4 py-3 text-sylva-50 placeholder-sylva-500 focus:border-amber-500 focus:outline-none mb-4"
                  />
                  <button
                    onClick={handleMpesaPayment}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-green-600 py-3 font-semibold text-sylva-50 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? "Sending STK Push..." : "Pay with M-Pesa"}
                  </button>
                  <p className="text-xs text-sylva-500 text-center mt-3">
                    You&apos;ll receive an M-Pesa prompt on your phone.
                    Confirm the payment to proceed.
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Alternative CTA */}
            <div className="mt-6 text-center">
              <p className="text-sm text-sylva-500 mb-2">
                Not ready to buy?
              </p>
              <Link
                href="/book"
                className="text-sm text-amber-400 hover:text-amber-300"
              >
                Book a free 30-min strategy call instead
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
