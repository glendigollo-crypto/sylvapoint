import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Sylvia Ndunge",
  description:
    "Go-to-Market Architect for Web3, Fintech, and Greentech startups. Building positioning, narrative, and growth systems for technical founders.",
};

const BELIEFS = [
  {
    number: "01",
    title: "The best marketing doesn't feel like marketing",
    description:
      "When positioning is right, your product sells through clarity, not persuasion. The goal isn't louder — it's clearer.",
  },
  {
    number: "02",
    title: "Every startup needs a GTM architect, not just a marketer",
    description:
      "Marketing execution without strategic positioning is just noise. Architecture first, campaigns second.",
  },
  {
    number: "03",
    title: "Africa's tech ecosystem will lead the next wave",
    description:
      "The innovations coming out of African fintech, Web3, and greentech will reshape global markets. I'm here to make sure the world hears about them.",
  },
  {
    number: "04",
    title: "Trust compounds faster than ad spend",
    description:
      "Community trust, thought leadership, and genuine value create exponential returns that no paid channel can match.",
  },
];

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/sylviandunge/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "X / Twitter",
    href: "https://x.com/sylviandunge",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@sylviandunge",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-sylva-950 via-sylva-900 to-sylva-800 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl flex flex-col md:flex-row items-center gap-12">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-amber-500/30 shadow-lg">
              <Image
                src="/images/generated/headshot-placeholder.png"
                alt="Sylvia Ndunge"
                width={192}
                height={192}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
              About
            </p>
            <h1 className="text-4xl font-bold text-sylva-50 sm:text-5xl">
              Sylvia Ndunge
            </h1>
            <p className="mt-4 text-lg text-sylva-400 leading-relaxed">
              Go-to-Market Architect for the founders building what&apos;s next
              in Web3, Fintech, and Greentech.
            </p>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
          <p>
            I&apos;ve spent my career at the intersection of technology and
            market strategy, working with founders who are building genuinely
            transformative products but struggling to make the market care.
          </p>
          <p>
            The pattern is always the same: brilliant technology, unclear
            positioning, and a go-to-market strategy that&apos;s either
            non-existent or copied from a company at a completely different stage.
            I fix that.
          </p>
          <p>
            As a fractional Go-to-Market Architect, I work embedded with
            founding teams to build the strategic layer between product and
            market. That means positioning, narrative design, growth
            infrastructure, and the systems that turn early traction into
            sustainable revenue.
          </p>
          <p>
            I built SylvaPoint — the GTM-6 audit framework — because I got tired
            of seeing the same gaps across every startup I worked with. Now any
            founder can diagnose their GTM readiness in 60 seconds, for free.
          </p>
        </div>
      </section>

      {/* Credentials Strip */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-sylva-900">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8">
            Ecosystems & Communities
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {["Hurupay", "PeerCarbon", "Sankore 2.0", "Harmonic Guild", "Kictanet"].map(
              (name) => (
                <div
                  key={name}
                  className="flex items-center justify-center h-10 px-5 rounded-lg bg-white border border-border text-sm font-semibold text-sylva-400"
                >
                  {name}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
            What I Believe
          </p>
          <h2 className="text-3xl font-bold text-sylva-50 mb-12">
            My GTM Philosophy
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {BELIEFS.map((belief) => (
              <div key={belief.number} className="pl-6 border-l-2 border-amber-500">
                <span className="text-3xl font-bold text-sylva-800">
                  {belief.number}
                </span>
                <h3 className="mt-2 text-lg font-bold text-sylva-50">
                  {belief.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {belief.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-sylva-900">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold text-sylva-50 mb-6">
            Let&apos;s Connect
          </h2>
          <div className="flex items-center justify-center gap-6">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-white text-sylva-300 hover:text-amber-500 hover:border-amber-500 transition-colors"
                aria-label={social.label}
              >
                {social.icon}
                <span className="text-sm font-medium">{social.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-sylva-50 mb-4">
            Let&apos;s Work Together
          </h2>
          <p className="text-muted-foreground mb-8">
            If you&apos;re building something meaningful and need help making the
            market understand why it matters — let&apos;s talk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/work-with-me"
              className="rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-amber-400 btn-lift"
            >
              View Services
            </Link>
            <Link
              href="/book"
              className="rounded-lg border-2 border-border px-8 py-4 text-lg font-semibold text-sylva-50 transition-all hover:border-sylva-50"
            >
              Book a Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
