import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "GTM insights, frameworks, and strategies for growing your business. Written by Sylvia Ndunge.",
};

const BLOG_POSTS = [
  {
    slug: "what-is-gtm-readiness",
    title: "What is GTM Readiness? The Complete Guide",
    excerpt:
      "GTM readiness measures how prepared your business is to acquire, convert, and retain customers. Learn the 6 dimensions that matter.",
    date: "2026-03-01",
    category: "Framework",
    readTime: "5 min",
  },
  {
    slug: "gtm-audit-how-to-score",
    title: "GTM Audit: How to Score Your Go-To-Market Strategy",
    excerpt:
      "A step-by-step guide to auditing your GTM strategy across positioning, copy, SEO, lead capture, performance, and visual creative.",
    date: "2026-02-25",
    category: "Guide",
    readTime: "7 min",
  },
  {
    slug: "website-grader-vs-gtm-audit",
    title: "Free Website Grader vs GTM Audit: What's the Difference?",
    excerpt:
      "HubSpot Website Grader and SEOptimer check technical SEO. A GTM audit evaluates your entire go-to-market funnel. Here's why that matters.",
    date: "2026-02-20",
    category: "Comparison",
    readTime: "4 min",
  },
  {
    slug: "6-dimensions-gtm-readiness",
    title: "The 6 Dimensions of GTM Readiness (The GTM-6 Framework)",
    excerpt:
      "Discover the GTM-6 Framework: Positioning, Copy, SEO, Lead Capture, Performance, and Visual Creative — and how each one impacts revenue.",
    date: "2026-02-15",
    category: "Framework",
    readTime: "6 min",
  },
  {
    slug: "how-to-improve-gtm-score",
    title: "How to Improve Your GTM Score",
    excerpt:
      "Practical tips to improve each of the 6 GTM dimensions. Quick wins that can boost your score by 20+ points in a week.",
    date: "2026-02-10",
    category: "Tips",
    readTime: "5 min",
  },
];

const CATEGORIES = ["All", "Framework", "Guide", "Comparison", "Tips"];

interface BlogPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function BlogIndexPage({ searchParams }: BlogPageProps) {
  const { category } = await searchParams;
  const activeCategory = category || "All";

  const filteredPosts =
    activeCategory === "All"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-sylva-50 mb-2">Blog</h1>
          <p className="text-muted-foreground mb-8">
            GTM insights, frameworks, and strategies for tech founders. Written
            by Sylvia Ndunge.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={cat === "All" ? "/blog" : `/blog?category=${cat}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-amber-500 text-sylva-950"
                    : "bg-sylva-900 text-muted-foreground hover:text-sylva-50 border border-border"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-xl border border-border bg-white p-6 hover:border-sylva-600 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {post.readTime}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {post.date}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-sylva-50 mb-2">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              </Link>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No posts in this category yet.
            </p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-xl border border-border bg-sylva-900 p-8">
            <h2 className="text-xl font-bold text-sylva-50 mb-2">
              Ready to audit your GTM?
            </h2>
            <p className="text-muted-foreground mb-4">
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
    </div>
  );
}
