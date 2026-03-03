import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — SylvaPoint",
  description:
    "GTM insights, frameworks, and strategies for growing your business.",
};

const BLOG_POSTS = [
  {
    slug: "what-is-gtm-readiness",
    title: "What is GTM Readiness? The Complete Guide",
    excerpt:
      "GTM readiness measures how prepared your business is to acquire, convert, and retain customers. Learn the 6 dimensions that matter.",
    date: "2026-03-01",
    category: "Framework",
  },
  {
    slug: "gtm-audit-how-to-score",
    title: "GTM Audit: How to Score Your Go-To-Market Strategy",
    excerpt:
      "A step-by-step guide to auditing your GTM strategy across positioning, copy, SEO, lead capture, performance, and visual creative.",
    date: "2026-02-25",
    category: "Guide",
  },
  {
    slug: "website-grader-vs-gtm-audit",
    title: "Free Website Grader vs GTM Audit: What's the Difference?",
    excerpt:
      "HubSpot Website Grader and SEOptimer check technical SEO. A GTM audit evaluates your entire go-to-market funnel. Here's why that matters.",
    date: "2026-02-20",
    category: "Comparison",
  },
  {
    slug: "6-dimensions-gtm-readiness",
    title: "The 6 Dimensions of GTM Readiness (The GTM-6 Framework)",
    excerpt:
      "Discover the GTM-6 Framework: Positioning, Copy, SEO, Lead Capture, Performance, and Visual Creative — and how each one impacts revenue.",
    date: "2026-02-15",
    category: "Framework",
  },
  {
    slug: "how-to-improve-gtm-score",
    title: "How to Improve Your GTM Score",
    excerpt:
      "Practical tips to improve each of the 6 GTM dimensions. Quick wins that can boost your score by 20+ points in a week.",
    date: "2026-02-10",
    category: "Tips",
  },
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-sylva-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-sylva-950 to-sylva-900 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-white">
              SylvaPoint
            </Link>
            <Link
              href="/audit"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-sylva-950 hover:bg-amber-400"
            >
              Free GTM Audit
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-white mb-2">Blog</h1>
          <p className="text-sylva-400 mb-10">
            GTM insights, frameworks, and strategies for growing your business.
          </p>

          <div className="space-y-6">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-xl border border-sylva-700 bg-sylva-900/50 p-6 hover:border-sylva-600 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    {post.category}
                  </span>
                  <span className="text-xs text-sylva-600">{post.date}</span>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">
                  {post.title}
                </h2>
                <p className="text-sm text-sylva-400">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-xl border border-sylva-700 bg-sylva-900/50 p-8">
            <h2 className="text-xl font-bold text-white mb-2">
              Ready to audit your GTM?
            </h2>
            <p className="text-sylva-400 mb-4">
              Get your free scorecard in 60 seconds.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-lg bg-amber-500 px-6 py-3 font-semibold text-sylva-950 hover:bg-amber-400"
            >
              Start Free Audit
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-sylva-800 py-8 px-4 text-center text-sm text-sylva-600">
        <p>
          Powered by{" "}
          <Link href="/" className="text-sylva-400 hover:text-white">
            SylvaPoint
          </Link>{" "}
          — The GTM-6 Framework
        </p>
      </footer>
    </div>
  );
}
