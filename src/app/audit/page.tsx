"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const auditSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "URL must start with http:// or https://"
    ),
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
            Enter your website details to get your GTM scorecard
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
            <input
              id="url"
              type="url"
              placeholder="https://example.com"
              className="mt-1 block w-full rounded-lg border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-sylva-500 focus:outline-none focus:ring-2 focus:ring-sylva-500/20"
              {...register("url")}
            />
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
            <input
              id="target_clients"
              type="text"
              placeholder="e.g., B2B SaaS founders, small business owners, marketing managers"
              className="mt-1 block w-full rounded-lg border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-sylva-500 focus:outline-none focus:ring-2 focus:ring-sylva-500/20"
              {...register("target_clients")}
            />
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
              Social Media Links{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="social_links"
              type="text"
              placeholder="e.g., linkedin.com/company/acme, twitter.com/acme"
              className="mt-1 block w-full rounded-lg border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-sylva-500 focus:outline-none focus:ring-2 focus:ring-sylva-500/20"
              {...register("social_links")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Comma-separated. Helps us analyze your social presence.
            </p>
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
