import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Static blog content — will be migrated to MDX/CMS in Phase 7
const BLOG_CONTENT: Record<
  string,
  { title: string; date: string; category: string; content: string }
> = {
  "what-is-gtm-readiness": {
    title: "What is GTM Readiness? The Complete Guide",
    date: "2026-03-01",
    category: "Framework",
    content: `
## What is GTM Readiness?

Go-To-Market (GTM) readiness measures how prepared your business is to effectively acquire, convert, and retain customers through your online presence. Unlike traditional website audits that focus on technical SEO or page speed, a GTM readiness assessment evaluates the **complete customer acquisition funnel**.

## Why GTM Readiness Matters

Most businesses invest heavily in driving traffic but neglect the conversion infrastructure. A website with great SEO but poor positioning will attract visitors who don't convert. A site with compelling copy but slow performance will lose visitors before they read a word.

GTM readiness connects all six dimensions into a unified score that reflects your actual ability to turn visitors into customers.

## The 6 Dimensions

1. **Positioning & Messaging** — Is your value proposition clear, differentiated, and targeted?
2. **Copy Effectiveness** — Does your copy persuade, or does it just describe?
3. **SEO & Content Quality** — Can your ideal customers find you?
4. **Lead Capture** — Are you converting visitors into leads effectively?
5. **Website Performance** — Is your site fast, accessible, and mobile-friendly?
6. **Visual & Creative** — Does your design build trust and guide action?

## How to Get Started

The fastest way to assess your GTM readiness is to run a free audit. In 60 seconds, you'll get a score across all 6 dimensions with specific recommendations for improvement.
    `,
  },
  "gtm-audit-how-to-score": {
    title: "GTM Audit: How to Score Your Go-To-Market Strategy",
    date: "2026-02-25",
    category: "Guide",
    content: `
## How We Score Your GTM Strategy

The SylvaPoint GTM audit uses a combination of AI analysis and rule-based scoring to evaluate your website across 6 dimensions. Each dimension is weighted based on your business type.

## The Scoring Process

1. **Crawl** — We analyze your homepage and up to 5 key pages
2. **Extract** — Headlines, CTAs, forms, images, videos, and testimonials are identified
3. **Analyze** — Each dimension is scored using frameworks from Dunford, Schwartz, Hormozi, and more
4. **Score** — Sub-scores are weighted and combined into a composite 0-100 score

## Understanding Your Grade

- **A (85-100)** — Exceptional GTM presence. You're in the top 10%.
- **B (70-84)** — Good foundation with room for optimization.
- **C (55-69)** — Average. Significant gaps are costing you conversions.
- **D (40-54)** — Below average. Multiple critical issues need attention.
- **F (0-39)** — Critical. Your GTM infrastructure needs a complete overhaul.

## What Makes a Good Score?

The average website scores between 50-60 (D+ to C-). Scores above 75 put you in the top 20% of businesses we've audited. The goal isn't perfection — it's identifying the highest-impact improvements.
    `,
  },
  "website-grader-vs-gtm-audit": {
    title: "Free Website Grader vs GTM Audit: What's the Difference?",
    date: "2026-02-20",
    category: "Comparison",
    content: `
## Website Graders vs GTM Audits

Tools like HubSpot Website Grader, SEOptimer, and GTmetrix are useful for checking technical health. But they only tell part of the story.

## What Website Graders Check

- Page speed and Core Web Vitals
- Mobile responsiveness
- Basic SEO tags (title, meta description, headings)
- Security (SSL, HTTPS)
- Image optimization

## What They Miss

- **Positioning clarity** — Is your value proposition compelling?
- **Copy persuasion** — Do your headlines follow proven formulas?
- **Lead capture quality** — Is your lead magnet relevant to your audience?
- **Visual trust signals** — Does your design build credibility?
- **Conversion readiness** — Can visitors easily take the next step?

## The GTM-6 Framework Difference

A GTM audit evaluates your website as a **revenue generation tool**, not just a technical artifact. It answers: "If a qualified prospect lands on this site, will they understand what you do, trust you, and take action?"

That's the question that matters for revenue. Page speed is important, but it's only 12% of the picture.
    `,
  },
  "6-dimensions-gtm-readiness": {
    title: "The 6 Dimensions of GTM Readiness (The GTM-6 Framework)",
    date: "2026-02-15",
    category: "Framework",
    content: `
## The GTM-6 Framework

The GTM-6 Framework evaluates your go-to-market presence across six interconnected dimensions. Each dimension draws from established marketing and business frameworks.

### 1. Positioning & Messaging (18%)

Based on April Dunford's positioning methodology, Eugene Schwartz's awareness levels, and Alex Hormozi's value equation. We evaluate transformation clarity, differentiation, value translation, target specificity, proof arsenal, and mechanism naming.

### 2. Copy Effectiveness (15%)

Evaluates your headlines against 12 proven formulas (Hopkins, Ogilvy, Schwartz), checks for AI-generated content patterns, measures CTA effectiveness, pain articulation, and objection handling.

### 3. SEO & Content Quality (15%)

Combines Google's E-E-A-T framework with readability analysis, content depth measurement, and freshness signals. Technical SEO is scored via Lighthouse.

### 4. Lead Capture (15%)

Assesses your lead magnets against 15 proven formats, evaluates offer specificity, form friction, bridge-to-paid quality, and social proof at the point of capture.

### 5. Website Performance (12%)

100% based on Google Lighthouse scores: performance, accessibility, SEO, and best practices. No subjectivity — pure technical measurement.

### 6. Visual & Creative (25%)

The highest-weighted dimension. Evaluates product photography, video content, platform visual compliance, brand consistency, and human presence/authenticity.
    `,
  },
  "how-to-improve-gtm-score": {
    title: "How to Improve Your GTM Score",
    date: "2026-02-10",
    category: "Tips",
    content: `
## Quick Wins to Improve Your GTM Score

Here are practical tips for each dimension that can boost your score by 20+ points.

### Positioning (+5-10 points)

- Add a clear transformation statement above the fold: "We help [target] achieve [outcome] through [mechanism]"
- Include at least 3 proof points (numbers, logos, testimonials)
- Name your methodology or framework

### Copy (+5-10 points)

- Rewrite your H1 using a proven headline formula
- Add specific numbers to your claims
- Remove AI-generated filler words (delve, comprehensive, leverage)
- Add at least one CTA per scroll depth

### SEO (+3-5 points)

- Add a unique meta description to every page
- Ensure H1-H3 hierarchy is logical
- Add schema markup for your business type

### Lead Capture (+5-10 points)

- Add a lead magnet above the fold
- Reduce form fields to email-only for initial capture
- Add social proof next to your opt-in form

### Performance (+3-5 points)

- Compress images to WebP format
- Implement lazy loading for below-fold images
- Remove unused JavaScript

### Visual (+5-10 points)

- Add a professional hero image or video
- Ensure brand colors are consistent across all pages
- Add human photos (team, customers) to build trust
    `,
  },
};

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_CONTENT[slug];

  if (!post) {
    return { title: "Blog Post Not Found" };
  }

  return {
    title: `${post.title} — SylvaPoint Blog`,
    description: post.content.slice(0, 160).replace(/[#\n]/g, "").trim(),
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = BLOG_CONTENT[slug];

  if (!post) {
    notFound();
  }

  // Simple markdown-to-html conversion for headings and lists
  const htmlContent = post.content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### "))
        return `<h3 class="text-lg font-bold text-white mt-8 mb-3">${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("## "))
        return `<h2 class="text-xl font-bold text-white mt-10 mb-4">${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("- "))
        return `<li class="text-sylva-300 ml-4">${trimmed
          .slice(2)
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}</li>`;
      if (trimmed.length === 0) return "";
      return `<p class="text-sylva-300 mb-4 leading-relaxed">${trimmed.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-white">$1</strong>'
      )}</p>`;
    })
    .join("\n");

  return (
    <div className="min-h-screen bg-sylva-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-sylva-950 to-sylva-900 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-white">
              SylvaPoint
            </Link>
            <Link
              href="/blog"
              className="text-sm text-sylva-400 hover:text-white"
            >
              All Posts
            </Link>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                {post.category}
              </span>
              <span className="text-xs text-sylva-600">{post.date}</span>
            </div>
            <h1 className="text-3xl font-bold text-white">{post.title}</h1>
          </div>

          <div
            className="prose-sylva"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-sylva-700 bg-sylva-900/50 p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Ready to see your score?
            </h2>
            <p className="text-sylva-400 mb-4">
              Get a free GTM audit in 60 seconds.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-lg bg-amber-500 px-6 py-3 font-semibold text-sylva-950 hover:bg-amber-400"
            >
              Start Free Audit
            </Link>
          </div>
        </div>
      </article>

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
