import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "GTM insights, frameworks, and strategies for growing your business. Written by Sylvia Ndunge.",
};

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
      {/* Hero */}
      <section className="bg-gradient-to-br from-sylva-950 via-sylva-900 to-sylva-800 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
            GTM Insights
          </p>
          <h1 className="text-3xl font-bold text-sylva-50 sm:text-4xl mb-2">
            The Blog
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Positioning strategy, go-to-market frameworks, and growth
            playbooks for tech founders. Written by Sylvia Ndunge.
          </p>
        </div>
      </section>

      <div className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {BLOG_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={cat === "All" ? "/blog" : `/blog?category=${cat}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-amber-500 text-white"
                    : "bg-sylva-900 text-muted-foreground hover:text-sylva-50 border border-border"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Featured Post (first post, larger) */}
          {filteredPosts.length > 0 && (
            <Link
              href={`/blog/${filteredPosts[0].slug}`}
              className="group block rounded-xl border border-border bg-white overflow-hidden hover:border-sylva-600 hover:shadow-lg transition-all mb-8"
            >
              <div className="grid md:grid-cols-2">
                <div className="relative aspect-[16/9] md:aspect-auto overflow-hidden bg-sylva-900">
                  <Image
                    src={filteredPosts[0].image}
                    alt={filteredPosts[0].title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                        filteredPosts[0].funnelStage === "Awareness"
                          ? "bg-blue-500/10 text-blue-300 border-blue-400/30"
                          : filteredPosts[0].funnelStage === "Education"
                            ? "bg-purple-500/10 text-purple-300 border-purple-400/30"
                            : "bg-green-500/10 text-green-300 border-green-400/30"
                      }`}
                    >
                      {filteredPosts[0].funnelStage}
                    </span>
                  </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                      {filteredPosts[0].category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {filteredPosts[0].readTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-sylva-50 group-hover:text-amber-500 transition-colors mb-3 leading-snug">
                    {filteredPosts[0].title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {filteredPosts[0].excerpt}
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {filteredPosts[0].displayDate}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Remaining Posts Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {filteredPosts.slice(1).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-border bg-white overflow-hidden hover:border-sylva-600 hover:shadow-md transition-all"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-sylva-900">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
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
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-sylva-50 group-hover:text-amber-500 transition-colors leading-snug line-clamp-2 mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {post.displayDate}
                  </p>
                </div>
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
      <div className="px-4 pb-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-xl bg-gradient-to-br from-sylva-950 via-sylva-900 to-sylva-800 p-10">
            <h2 className="text-xl font-bold text-sylva-50 mb-2">
              Ready to audit your GTM?
            </h2>
            <p className="text-sylva-400 mb-6">
              Get your free scorecard across all 6 dimensions in 60 seconds.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-lg bg-amber-500 px-6 py-3 font-semibold text-white hover:bg-amber-400 transition-colors"
            >
              Start Free Audit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
