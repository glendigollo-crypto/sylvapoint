import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getBlogPost, BLOG_POSTS } from "@/lib/blog/posts";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return { title: "Blog Post Not Found" };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.image, width: 1200, height: 630 }],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Simple markdown-to-html conversion
  const htmlContent = post.content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### "))
        return `<h3 class="text-lg font-bold text-sylva-50 mt-8 mb-3">${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("## "))
        return `<h2 class="text-xl font-bold text-sylva-50 mt-10 mb-4">${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("- "))
        return `<li class="text-sylva-300 ml-4">${trimmed
          .slice(2)
          .replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="text-sylva-50">$1</strong>'
          )}</li>`;
      if (trimmed.length === 0) return "";
      return `<p class="text-sylva-300 mb-4 leading-relaxed">${trimmed.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-sylva-50">$1</strong>'
      )}</p>`;
    })
    .join("\n");

  // Get related posts (same funnel stage, excluding current)
  const relatedPosts = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.funnelStage === post.funnelStage
  ).slice(0, 2);

  // If not enough same-stage, fill from next stage
  if (relatedPosts.length < 2) {
    const nextStage =
      post.funnelStage === "Awareness"
        ? "Education"
        : post.funnelStage === "Education"
          ? "Conversion"
          : "Awareness";
    const extras = BLOG_POSTS.filter(
      (p) =>
        p.slug !== post.slug &&
        p.funnelStage === nextStage &&
        !relatedPosts.includes(p)
    ).slice(0, 2 - relatedPosts.length);
    relatedPosts.push(...extras);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Image */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] bg-sylva-900">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      {/* Article */}
      <article className="px-4 -mt-12 relative">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2">
            <Link
              href="/blog"
              className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
            >
              &larr; All Posts
            </Link>
          </div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                {post.category}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                  post.funnelStage === "Awareness"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : post.funnelStage === "Education"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-green-50 text-green-700 border-green-200"
                }`}
              >
                {post.funnelStage}
              </span>
              <span className="text-xs text-muted-foreground">
                {post.readTime}
              </span>
              <span className="text-xs text-muted-foreground">
                {post.displayDate}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-sylva-50 leading-tight">
              {post.title}
            </h1>
          </div>

          <div
            className="prose-sylva"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Post-specific CTA */}
          <div className="mt-12 rounded-xl bg-gradient-to-br from-sylva-950 via-sylva-900 to-sylva-800 p-8 text-center">
            <h2 className="text-xl font-bold text-sylva-50 mb-2">
              {post.cta.text === "Audit Your GTM Free"
                ? "Ready to see where your GTM stands?"
                : post.cta.text === "See Your Narrative Score"
                  ? "How clear is your narrative?"
                  : post.cta.text === "Get Your GTM-6 Score"
                    ? "Get your score across all 6 dimensions"
                    : post.cta.text === "Score Your Positioning"
                      ? "See how your positioning stacks up"
                      : "Get your free GTM scorecard"}
            </h2>
            <p className="text-sylva-400 mb-4">
              Free. No email required. Results in 60 seconds.
            </p>
            <Link
              href={post.cta.href}
              className="inline-block rounded-lg bg-amber-500 px-6 py-3 font-semibold text-white hover:bg-amber-400 transition-colors"
            >
              {post.cta.text}
            </Link>
          </div>

          {/* Author Bio */}
          <div className="mt-8 flex items-center gap-4 rounded-xl border border-border bg-sylva-900 p-6">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/20 shrink-0">
              <Image
                src="/images/generated/sn-logo-hex.png"
                alt="Sylvia Ndunge"
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <p className="font-semibold text-sylva-50">Sylvia Ndunge</p>
              <p className="text-sm text-muted-foreground">
                Go-to-Market Architect for Web3, Fintech, and Greentech
                pioneers.
              </p>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-bold text-sylva-50 mb-6">
                Continue Reading
              </h3>
              <div className="grid gap-6 sm:grid-cols-2">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group block rounded-xl border border-border bg-white overflow-hidden hover:border-sylva-600 hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-sylva-900">
                      <Image
                        src={related.image}
                        alt={related.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                        {related.category}
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-sylva-50 group-hover:text-amber-500 transition-colors line-clamp-2">
                        {related.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Spacer before footer */}
      <div className="h-16" />
    </div>
  );
}
