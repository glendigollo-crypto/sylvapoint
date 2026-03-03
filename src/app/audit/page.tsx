"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const auditSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .transform((val) => {
      const trimmed = val.trim();
      if (trimmed && !/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
      }
      return trimmed;
    })
    .pipe(z.string().url("Please enter a valid URL (e.g. example.com)")),
  business_type: z.enum(["saas", "services", "info_product"], {
    message: "Please select a business type",
  }),
  target_clients: z
    .string()
    .min(1, "Please describe your target clients"),
  social_links: z.string().optional(),
});

type AuditFormData = z.infer<typeof auditSchema>;

export default function AuditPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuditFormData>({
    defaultValues: {
      business_type: "services",
    },
  });

  const onSubmit = async (data: AuditFormData) => {
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

  return (
    <div className="min-h-screen bg-sylva-50">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-sylva-900">
            GTM Audit
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter your website and social media details to get your GTM scorecard
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-10 space-y-6 rounded-xl bg-white p-8 shadow-sm border border-border"
        >
          {/* URL */}
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-sylva-900"
            >
              Website URL <span className="text-grade-f">*</span>
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground text-sm select-none">
                https://
              </span>
              <input
                id="url"
                type="text"
                placeholder="yourwebsite.com"
                className="block w-full rounded-lg border border-border pl-[4.5rem] pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-sylva-500 focus:outline-none focus:ring-2 focus:ring-sylva-500/20"
                {...register("url")}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter your website address — e.g. <strong>yourcompany.com</strong>
            </p>
            {errors.url && (
              <p className="mt-1 text-sm text-grade-f">{errors.url.message}</p>
            )}
          </div>

          {/* Business Type */}
          <div>
            <label
              htmlFor="business_type"
              className="block text-sm font-medium text-sylva-900"
            >
              Business Type <span className="text-grade-f">*</span>
            </label>
            <select
              id="business_type"
              className="mt-1 block w-full rounded-lg border border-border px-4 py-3 text-foreground focus:border-sylva-500 focus:outline-none focus:ring-2 focus:ring-sylva-500/20"
              {...register("business_type")}
            >
              <option value="saas">SaaS / Software</option>
              <option value="services">Services / Agency / Consulting</option>
              <option value="info_product">
                Info Product / Course / Coaching
              </option>
            </select>
            {errors.business_type && (
              <p className="mt-1 text-sm text-grade-f">
                {errors.business_type.message}
              </p>
            )}
          </div>

          {/* Target Clients */}
          <div>
            <label
              htmlFor="target_clients"
              className="block text-sm font-medium text-sylva-900"
            >
              Who are your target clients?{" "}
              <span className="text-grade-f">*</span>
            </label>
            <textarea
              id="target_clients"
              rows={2}
              placeholder={"e.g., Series A B2B SaaS founders looking to scale from $1M to $10M ARR"}
              className="mt-1 block w-full rounded-lg border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-sylva-500 focus:outline-none focus:ring-2 focus:ring-sylva-500/20 resize-none"
              {...register("target_clients")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Be specific — include role, company size, or industry.
              The more detail, the more relevant your audit.
            </p>
            {errors.target_clients && (
              <p className="mt-1 text-sm text-grade-f">
                {errors.target_clients.message}
              </p>
            )}
          </div>

          {/* Social Links */}
          <div>
            <label
              htmlFor="social_links"
              className="block text-sm font-medium text-sylva-900"
            >
              Social Media Profiles{" "}
              <span className="text-muted-foreground">(recommended)</span>
            </label>
            <textarea
              id="social_links"
              rows={3}
              placeholder={"linkedin.com/company/acme\ntwitter.com/acme\ninstagram.com/acme"}
              className="mt-1 block w-full rounded-lg border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-sylva-500 focus:outline-none focus:ring-2 focus:ring-sylva-500/20 resize-none font-mono text-sm"
              {...register("social_links")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              One per line, or separated by commas. No need for https:// — we add it automatically.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["LinkedIn", "X / Twitter", "Instagram", "TikTok", "YouTube", "Facebook"].map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center rounded-full bg-sylva-50 px-2.5 py-0.5 text-xs text-sylva-600 border border-sylva-100"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-grade-f">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-amber-500 px-6 py-4 text-lg font-semibold text-sylva-950 transition-colors hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Starting Audit..." : "Start GTM Audit — Free"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Free. No credit card. No email required. Results in ~60 seconds.
          </p>
        </form>
      </div>
    </div>
  );
}
