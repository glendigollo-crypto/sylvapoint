"use client";

import Link from "next/link";
import Image from "next/image";
import { getHomepagePosts } from "@/lib/blog/posts";
import { ArrowRight } from "lucide-react";

const POSTS = getHomepagePosts();

export function LatestPosts() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
              From the Blog
            </p>
            <h2 className="text-3xl font-bold text-sylva-50">GTM Insights</h2>
          </div>
          <Link
            href="/blog"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            View All Posts <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {POSTS.map((post, i) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              data-post-card
              className="group block rounded-xl border border-border bg-white overflow-hidden transition-all hover:shadow-lg hover:border-sylva-600"
            >
              {/* Image */}
              <div className="relative aspect-[16/9] overflow-hidden bg-sylva-900">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
                {/* Funnel stage pill */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                      post.funnelStage === "Awareness"
                        ? "bg-blue-500/10 text-blue-300 border-blue-400/30"
                        : post.funnelStage === "Education"
                          ? "bg-purple-500/10 text-purple-300 border-purple-400/30"
                          : "bg-green-500/10 text-green-300 border-green-400/30"
                    }`}
                  >
                    {post.funnelStage}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {post.readTime}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-sylva-50 group-hover:text-amber-500 transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {post.displayDate}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            View All Posts <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
