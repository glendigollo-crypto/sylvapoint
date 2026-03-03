"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Pencil, Check, Sparkles, Globe, Loader2, AlertTriangle } from "lucide-react";
import type { DetectResponse } from "@/app/api/detect/route";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Phase = "idle" | "detecting" | "detected" | "submitting";

const BUSINESS_TYPES = [
  { value: "saas", label: "SaaS / Software" },
  { value: "ecommerce", label: "E-Commerce / D2C" },
  { value: "marketplace", label: "Marketplace / Platform" },
  { value: "services", label: "Services / Agency / Consulting" },
  { value: "info_product", label: "Info Product / Course / Coaching" },
  { value: "enterprise", label: "Enterprise Software" },
] as const;

const INDUSTRIES = [
  { value: "technology", label: "Technology / Software" },
  { value: "fintech", label: "Fintech / Financial Services" },
  { value: "healthcare", label: "Healthcare / Biotech" },
  { value: "ecommerce_retail", label: "E-Commerce / Retail" },
  { value: "education", label: "Education / EdTech" },
  { value: "real_estate", label: "Real Estate / PropTech" },
  { value: "legal", label: "Legal / Compliance" },
  { value: "marketing", label: "Marketing / Agencies" },
  { value: "hr_recruiting", label: "HR / Recruiting" },
  { value: "manufacturing", label: "Manufacturing / Industrial" },
  { value: "nonprofit", label: "Nonprofit / Social Impact" },
  { value: "media", label: "Media / Entertainment" },
  { value: "other", label: "Other" },
] as const;

const SOCIAL_PLATFORMS: Record<string, { label: string; color: string }> = {
  linkedin: { label: "LinkedIn", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  twitter: { label: "X", color: "bg-gray-500/10 text-gray-700 border-gray-500/20" },
  instagram: { label: "Instagram", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
  youtube: { label: "YouTube", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  tiktok: { label: "TikTok", color: "bg-gray-500/10 text-gray-700 border-gray-500/20" },
  facebook: { label: "Facebook", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  github: { label: "GitHub", color: "bg-gray-500/10 text-gray-800 border-gray-500/20" },
};

function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return "linkedin";
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "twitter";
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("youtube.com")) return "youtube";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("facebook.com")) return "facebook";
  if (lower.includes("github.com")) return "github";
  return "other";
}

// ---------------------------------------------------------------------------
// Stagger variants
// ---------------------------------------------------------------------------

const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

// ---------------------------------------------------------------------------
// DetectionCard — reusable glass card shell
// ---------------------------------------------------------------------------

function DetectionCard({
  icon,
  label,
  confidence,
  editing,
  onEdit,
  onConfirm,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  confidence: number;
  editing: boolean;
  onEdit: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={cardItemVariants} className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-500">{icon}</span>
          <span className="text-sm font-semibold text-sylva-50">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {confidence > 0.5 && !editing && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
              <Sparkles size={10} />
              AI Detected
            </span>
          )}
          {editing ? (
            <button
              onClick={onConfirm}
              className="p-1 rounded-md hover:bg-sylva-800 transition-colors text-grade-a"
              aria-label="Confirm"
            >
              <Check size={14} />
            </button>
          ) : (
            <button
              onClick={onEdit}
              className="p-1 rounded-md hover:bg-sylva-800 transition-colors text-sylva-400"
              aria-label="Edit"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main intake component
// ---------------------------------------------------------------------------

function AuditIntakeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Phase state
  const [phase, setPhase] = useState<Phase>("idle");
  const [url, setUrl] = useState("");
  const [detection, setDetection] = useState<DetectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [businessType, setBusinessType] = useState("services");
  const [industry, setIndustry] = useState("");
  const [targetClients, setTargetClients] = useState("");
  const [socialLinks, setSocialLinks] = useState<string[]>([]);
  const [competitorUrl, setCompetitorUrl] = useState("");

  // Edit modes
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [editingSocial, setEditingSocial] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState(false);

  // Run detection
  const runDetection = useCallback(
    async (targetUrl: string) => {
      setPhase("detecting");
      setError(null);

      try {
        const res = await fetch("/api/detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Detection failed" }));
          throw new Error(err.error || "Detection failed");
        }

        const data: DetectResponse = await res.json();
        setDetection(data);

        // Populate editable state
        setBusinessType(data.business_type || "services");
        setIndustry(data.industry || "");
        setTargetClients(data.target_audience || "");
        setSocialLinks(data.social_links || []);
        setCompetitorUrl(data.competitors?.[0] || "");

        // If confidence is 0, open all cards in edit mode
        if (data.confidence === 0) {
          setEditingBusiness(true);
          setEditingIndustry(true);
          setEditingTarget(true);
        }

        setPhase("detected");
      } catch (err) {
        // Fallback to manual — show cards with empty/default values
        setDetection({
          business_type: "services",
          industry: "other",
          target_audience: "",
          social_links: [],
          competitors: [],
          meta_title: "",
          meta_description: "",
          confidence: 0,
        });
        setEditingBusiness(true);
        setEditingIndustry(true);
        setEditingTarget(true);
        setError(err instanceof Error ? err.message : "Detection failed");
        setPhase("detected");
      }
    },
    [],
  );

  // Auto-detect from ?url= param
  useEffect(() => {
    const paramUrl = searchParams.get("url");
    if (paramUrl && !url) {
      let normalized = paramUrl.trim();
      if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
      setUrl(normalized);
      runDetection(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle scan
  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    setUrl(normalized);
    runDetection(normalized);
  };

  // Handle launch
  const handleLaunch = async () => {
    setPhase("submitting");
    setError(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          business_type: businessType,
          industry: industry || undefined,
          target_clients: targetClients,
          social_links: socialLinks.length > 0 ? socialLinks.join(", ") : undefined,
          competitor_url: competitorUrl || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to start audit" }));
        throw new Error(err.error || "Failed to start audit");
      }

      const data = await res.json();
      router.push(`/audit/loading?slug=${data.share_slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("detected");
    }
  };

  const confidence = detection?.confidence ?? 0;
  const canLaunch = url && businessType && targetClients;

  return (
    <div className="min-h-[80vh] bg-sylva-900">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {/* ─── Phase 1: Idle — URL Input ─── */}
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center pt-12 sm:pt-20"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-500 mb-6">
                Powered by the GTM-6 Framework
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-sylva-50 leading-tight">
                Paste your URL.
                <br />
                <span className="text-amber-500">We&apos;ll do the rest.</span>
              </h1>

              <p className="mt-4 text-muted-foreground max-w-lg leading-relaxed">
                Our AI analyzes your website and auto-detects your business
                profile in seconds.
              </p>

              <form onSubmit={handleScan} className="mt-10 w-full max-w-lg">
                <div className="relative input-glow-pulse rounded-xl">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-sylva-400 text-sm select-none">
                    https://
                  </span>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="yourwebsite.com"
                    autoFocus
                    className="block w-full rounded-xl border border-sylva-700 bg-sylva-950 pl-[4.75rem] pr-28 py-4 text-sylva-50 placeholder:text-sylva-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-base"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-sylva-950 transition-all hover:bg-amber-400 flex items-center gap-1.5"
                  >
                    Scan <ArrowRight size={14} />
                  </button>
                </div>
              </form>

              <p className="mt-4 text-xs text-muted-foreground">
                Free. No email required. AI-powered detection.
              </p>

              <p className="mt-12 text-xs text-sylva-500">
                Built by{" "}
                <a
                  href="/about"
                  className="text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Sylvia Ndunge
                </a>
              </p>
            </motion.div>
          )}

          {/* ─── Phase 2: Detecting ─── */}
          {phase === "detecting" && (
            <motion.div
              key="detecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center pt-12 sm:pt-20"
            >
              {/* Compact URL display */}
              <div className="inline-flex items-center gap-2 rounded-full bg-sylva-800 border border-sylva-700 px-4 py-2 mb-10">
                <Globe size={14} className="text-amber-500" />
                <span className="text-sm text-sylva-50 font-medium">
                  {url.replace(/^https?:\/\//, "")}
                </span>
                <button
                  onClick={() => {
                    setPhase("idle");
                    setDetection(null);
                  }}
                  className="text-xs text-sylva-400 hover:text-amber-500 transition-colors ml-1"
                >
                  change
                </button>
              </div>

              {/* Scanning animation */}
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 size={40} className="text-amber-500" />
                </motion.div>
                <p className="text-lg font-medium text-sylva-50">
                  Analyzing your website...
                </p>
                <p className="text-sm text-muted-foreground">
                  Detecting business type, industry, and audience
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── Phase 3: Detected — Smart Cards ─── */}
          {(phase === "detected" || phase === "submitting") && (
            <motion.div
              key="detected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Compact URL display */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-sylva-800 border border-sylva-700 px-4 py-2">
                  <Globe size={14} className="text-amber-500" />
                  <span className="text-sm text-sylva-50 font-medium">
                    {url.replace(/^https?:\/\//, "")}
                  </span>
                  <button
                    onClick={() => {
                      setPhase("idle");
                      setDetection(null);
                    }}
                    className="text-xs text-sylva-400 hover:text-amber-500 transition-colors ml-1"
                  >
                    change
                  </button>
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 mb-6"
                >
                  <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-500">
                    {confidence === 0
                      ? "Auto-detection unavailable. Fill in the details below."
                      : error}
                  </p>
                </motion.div>
              )}

              {/* Smart Cards grid */}
              <motion.div
                variants={cardContainerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Business Type */}
                <DetectionCard
                  icon={<Sparkles size={16} />}
                  label="Business Type"
                  confidence={confidence}
                  editing={editingBusiness}
                  onEdit={() => setEditingBusiness(true)}
                  onConfirm={() => setEditingBusiness(false)}
                >
                  {editingBusiness ? (
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>
                          {bt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-foreground font-medium">
                      {BUSINESS_TYPES.find((bt) => bt.value === businessType)?.label || businessType}
                    </p>
                  )}
                </DetectionCard>

                {/* Industry */}
                <DetectionCard
                  icon={<Globe size={16} />}
                  label="Industry"
                  confidence={confidence}
                  editing={editingIndustry}
                  onEdit={() => setEditingIndustry(true)}
                  onConfirm={() => setEditingIndustry(false)}
                >
                  {editingIndustry ? (
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="">Select industry...</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.value} value={ind.value}>
                          {ind.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-foreground font-medium">
                      {INDUSTRIES.find((ind) => ind.value === industry)?.label || industry || "Not specified"}
                    </p>
                  )}
                </DetectionCard>

                {/* Target Audience */}
                <DetectionCard
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  }
                  label="Target Audience"
                  confidence={confidence}
                  editing={editingTarget}
                  onEdit={() => setEditingTarget(true)}
                  onConfirm={() => setEditingTarget(false)}
                >
                  {editingTarget ? (
                    <textarea
                      value={targetClients}
                      onChange={(e) => setTargetClients(e.target.value)}
                      rows={2}
                      placeholder="e.g., Series A B2B SaaS founders looking to scale from $1M to $10M ARR"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground bg-white placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                    />
                  ) : (
                    <p className="text-foreground font-medium text-sm leading-relaxed">
                      {targetClients || (
                        <span className="text-muted-foreground italic">Click edit to describe your audience</span>
                      )}
                    </p>
                  )}
                </DetectionCard>

                {/* Social Profiles */}
                <DetectionCard
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  }
                  label="Social Profiles"
                  confidence={socialLinks.length > 0 ? 0.9 : 0}
                  editing={editingSocial}
                  onEdit={() => setEditingSocial(true)}
                  onConfirm={() => setEditingSocial(false)}
                >
                  {editingSocial ? (
                    <textarea
                      value={socialLinks.join("\n")}
                      onChange={(e) =>
                        setSocialLinks(
                          e.target.value
                            .split("\n")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                      rows={3}
                      placeholder={"linkedin.com/company/acme\ntwitter.com/acme"}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground bg-white font-mono placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                    />
                  ) : socialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {socialLinks.map((link) => {
                        const platform = detectPlatform(link);
                        const info = SOCIAL_PLATFORMS[platform];
                        return (
                          <span
                            key={link}
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                              info?.color || "bg-sylva-800 text-sylva-300 border-sylva-700"
                            }`}
                          >
                            {info?.label || new URL(link.startsWith("http") ? link : `https://${link}`).hostname}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No social profiles detected
                    </p>
                  )}
                </DetectionCard>

                {/* Competitor */}
                <DetectionCard
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  }
                  label="Competitor"
                  confidence={competitorUrl ? 0.7 : 0}
                  editing={editingCompetitor}
                  onEdit={() => setEditingCompetitor(true)}
                  onConfirm={() => setEditingCompetitor(false)}
                >
                  {editingCompetitor ? (
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-xs select-none">
                        https://
                      </span>
                      <input
                        type="text"
                        value={competitorUrl}
                        onChange={(e) => setCompetitorUrl(e.target.value)}
                        placeholder="competitor.com"
                        className="w-full rounded-lg border border-border pl-[3.5rem] pr-3 py-2 text-sm text-foreground bg-white placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  ) : competitorUrl ? (
                    <span className="inline-flex items-center rounded-full bg-sylva-800/60 border border-sylva-700 px-3 py-1 text-sm text-foreground">
                      {competitorUrl}
                    </span>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No competitor suggested — click edit to add one
                    </p>
                  )}
                </DetectionCard>
              </motion.div>

              {/* Launch CTA */}
              <AnimatePresence>
                {canLaunch && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mt-8"
                  >
                    <button
                      onClick={handleLaunch}
                      disabled={phase === "submitting"}
                      className="w-full rounded-xl bg-amber-500 px-6 py-4 text-lg font-semibold text-sylva-950 transition-all hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed btn-lift flex items-center justify-center gap-2"
                    >
                      {phase === "submitting" ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Launching Audit...
                        </>
                      ) : (
                        <>
                          Launch GTM Audit
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Free. No credit card. Results in ~60 seconds.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Missing fields hint */}
              {!canLaunch && phase === "detected" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-center text-sm text-muted-foreground"
                >
                  Fill in <strong>Business Type</strong> and{" "}
                  <strong>Target Audience</strong> to launch your audit.
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export with Suspense boundary (useSearchParams requirement)
// ---------------------------------------------------------------------------

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] bg-sylva-900 flex items-center justify-center">
          <Loader2 size={32} className="text-amber-500 animate-spin" />
        </div>
      }
    >
      <AuditIntakeContent />
    </Suspense>
  );
}
