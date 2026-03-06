"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { ThesisSection } from "@/components/home/ThesisSection";
import { LogoStrip } from "@/components/home/LogoStrip";
import { ToolShowcase } from "@/components/home/ToolShowcase";
import { EngagementPaths } from "@/components/home/EngagementPaths";
import { LatestPosts } from "@/components/home/LatestPosts";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [heroUrl, setHeroUrl] = useState("");

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero-headline]", { y: 40, opacity: 0, duration: 0.8 })
        .from("[data-hero-sub]", { y: 20, opacity: 0, duration: 0.6 }, "-=0.3")
        .from("[data-hero-form]", { y: 20, opacity: 0, duration: 0.5 }, "-=0.2")
        .from("[data-hero-secondary]", { y: 10, opacity: 0, duration: 0.4 }, "-=0.1");
    },
    { scope: heroRef }
  );

  const handleHeroAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroUrl.trim()) {
      router.push("/audit");
      return;
    }
    router.push(`/audit?url=${encodeURIComponent(heroUrl.trim())}`);
  };

  return (
    <div className="min-h-screen">
      {/* ───── Hero Section ───── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-sylva-950 via-sylva-900 to-sylva-800"
      >
        {/* AI-generated hero background */}
        <Image
          src="/images/generated/hero-bg.png"
          alt=""
          fill
          className="object-cover opacity-10 pointer-events-none"
          priority
        />

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p
              data-hero-headline
              className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-4"
            >
              Go-to-Market Architect
            </p>
            <h1
              data-hero-headline
              className="text-4xl font-bold tracking-tight text-sylva-50 sm:text-5xl lg:text-6xl leading-[1.1]"
            >
              Innovation Without a Narrative
              <br />
              <span className="text-amber-500">is Just Code.</span>
            </h1>
            <p
              data-hero-sub
              className="mt-6 text-lg text-sylva-400 max-w-xl leading-relaxed"
            >
              I help AI, Fintech, and Greentech founders turn technical
              innovation into market traction — through positioning, narrative
              strategy, and the GTM-6 framework.
            </p>

            {/* Inline URL Audit Form */}
            <form
              data-hero-form
              onSubmit={handleHeroAudit}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg"
            >
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sylva-500 text-sm select-none">
                  https://
                </span>
                <input
                  type="text"
                  value={heroUrl}
                  onChange={(e) => setHeroUrl(e.target.value)}
                  placeholder="yourwebsite.com"
                  className="block w-full rounded-lg border border-sylva-700 bg-white pl-[4.5rem] pr-4 py-3.5 text-sylva-50 placeholder:text-sylva-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-amber-400 btn-lift whitespace-nowrap flex items-center justify-center gap-2"
              >
                Audit My GTM
                <ArrowRight size={16} />
              </button>
            </form>
            <p data-hero-secondary className="mt-3 text-xs text-sylva-500">
              Free. No email required. Results in 60 seconds.
            </p>

            <div data-hero-secondary className="mt-8">
              <Link
                href="/book"
                className="text-sm font-medium text-sylva-400 hover:text-amber-500 transition-colors inline-flex items-center gap-1"
              >
                Or book a strategy call <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Headshot */}
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 xl:right-16">
            <div className="w-64 h-64 xl:w-80 xl:h-80 rounded-full overflow-hidden border-2 border-amber-500/20 shadow-lg float-gentle">
              <Image
                src="/images/generated/hero-portrait.png"
                alt="Sylvia Ndunge"
                width={320}
                height={320}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───── GTM Truths ───── */}
      <ThesisSection />

      {/* ───── Trust Logos ───── */}
      <LogoStrip />

      {/* ───── Tool Showcase ───── */}
      <ToolShowcase />

      {/* ───── Engagement Paths ───── */}
      <EngagementPaths />

      {/* ───── Latest Blog Posts ───── */}
      <LatestPosts />

      {/* ───── Final CTA ───── */}
      <section className="relative bg-gradient-to-br from-sylva-950 via-sylva-900 to-sylva-800 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <Image
          src="/images/generated/cta-pattern.png"
          alt=""
          fill
          className="object-cover opacity-[0.06] pointer-events-none"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-sylva-50">
            Your GTM has gaps. Let&apos;s find them.
          </h2>
          <p className="mt-4 text-sylva-400">
            Most startups leave 40-60% of their GTM potential on the table.
            Find out where you stand — then fix it.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/audit"
              className="rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-amber-400 btn-lift"
            >
              Start Your Free Audit
            </Link>
            <Link
              href="/book"
              className="rounded-lg border-2 border-sylva-700 px-8 py-4 text-lg font-semibold text-sylva-50 transition-all hover:border-sylva-50 hover:bg-sylva-50/5"
            >
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
