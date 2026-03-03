"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";

const POSTS = [
  {
    slug: "what-is-gtm-readiness",
    title: "What is GTM Readiness? The Complete Guide",
    excerpt:
      "GTM readiness measures how prepared your business is to acquire, convert, and retain customers. Learn the 6 dimensions that matter.",
    date: "Mar 1, 2026",
    category: "Framework",
    readTime: "5 min",
  },
  {
    slug: "gtm-audit-how-to-score",
    title: "GTM Audit: How to Score Your Go-To-Market Strategy",
    excerpt:
      "A step-by-step guide to auditing your GTM strategy across positioning, copy, SEO, lead capture, performance, and visual creative.",
    date: "Feb 25, 2026",
    category: "Guide",
    readTime: "7 min",
  },
  {
    slug: "6-dimensions-gtm-readiness",
    title: "The 6 Dimensions of GTM Readiness",
    excerpt:
      "Discover the GTM-6 Framework and how each dimension impacts revenue.",
    date: "Feb 15, 2026",
    category: "Framework",
    readTime: "6 min",
  },
];

export function LatestPosts() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-post-card]", {
        opacity: 0,
        y: 24,
        duration: 0.5,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div ref={containerRef} className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
              From the Blog
            </p>
            <h2 className="text-3xl font-bold text-sylva-50">
              GTM Insights
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden sm:inline-flex text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            View All Posts &rarr;
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              data-post-card
              className="group block rounded-xl border border-border bg-white p-6 transition-all hover:shadow-lg hover:border-sylva-600"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                  {post.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {post.readTime}
                </span>
              </div>
              <h3 className="text-lg font-bold text-sylva-50 group-hover:text-amber-500 transition-colors">
                {post.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {post.excerpt}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">{post.date}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            View All Posts &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
