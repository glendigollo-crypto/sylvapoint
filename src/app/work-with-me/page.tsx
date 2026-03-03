import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ServiceCard } from "@/components/portfolio/ServiceCard";
import { FitQualifier } from "@/components/portfolio/FitQualifier";

export const metadata: Metadata = {
  title: "Work With Me",
  description:
    "Fractional Go-to-Market Architect for Web3, Fintech, and Greentech startups. GTM clarity, growth engine builds, and funding capitalization.",
};

const SERVICES = [
  {
    number: "01",
    title: "The Go-to-Market Clarity Blueprint",
    duration: "90-day engagement",
    description:
      "You've built something real, but the market doesn't understand why it matters. This engagement strips away the jargon and builds a positioning foundation that makes your innovation impossible to ignore.",
    deliverables: [
      "Category design and competitive positioning map",
      "Core narrative and messaging framework",
      "ICP definition with buyer persona documentation",
      "Channel strategy and GTM launch sequence",
      "Objection handling and sales enablement deck",
    ],
    direction: "left" as const,
  },
  {
    number: "02",
    title: "The Growth Engine Build",
    duration: "0-to-1 growth sprint",
    description:
      "You have product-market fit signals but no repeatable growth motion. This builds the engine — from lead generation to conversion infrastructure to retention loops.",
    deliverables: [
      "Full-funnel audit and gap analysis",
      "Content engine setup (blog, social, email)",
      "Lead capture and nurture sequence design",
      "Conversion rate optimization roadmap",
      "KPI dashboard and measurement framework",
    ],
    direction: "right" as const,
  },
  {
    number: "03",
    title: "The Funding Capitalization System",
    duration: "Post-raise visibility sprint",
    description:
      "You just raised. Now what? This turns your funding moment into sustained market visibility, investor confidence, and pipeline acceleration.",
    deliverables: [
      "Funding announcement PR and comms strategy",
      "Thought leadership content calendar",
      "Investor update template and cadence",
      "Market positioning refresh for new stage",
      "Partnership and ecosystem GTM plan",
    ],
    direction: "left" as const,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Sylvia didn't just give us a marketing plan — she gave us a narrative. Our conversion rate doubled within the first month.",
    name: "Founder",
    company: "Web3 Startup",
  },
  {
    quote:
      "She sees the gap between what you've built and what the market hears. That clarity is worth more than any ad budget.",
    name: "CEO",
    company: "Fintech Startup",
  },
];

export default function WorkWithMePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-sylva-50 via-sylva-100 to-sylva-200 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <Image
          src="/images/generated/services-hero.png"
          alt=""
          fill
          className="object-cover opacity-10 pointer-events-none"
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-4">
            Fractional GTM Leadership
          </p>
          <h1 className="text-4xl font-bold text-sylva-950 sm:text-5xl leading-tight">
            I&apos;m a Go-to-Market Architect
            <br />
            for <span className="text-amber-500">Pioneers</span>
          </h1>
          <p className="mt-6 text-lg text-sylva-400 max-w-2xl mx-auto">
            Web3, Fintech, and Greentech startups hire me to turn technical
            innovation into market traction. I build positioning, narrative, and
            growth systems — not campaigns.
          </p>
        </div>
      </section>

      {/* Fit Qualifier */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-sylva-50 mb-8 text-center">
            Is This Right for You?
          </h2>
          <FitQualifier />
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-sylva-900">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
            Services
          </p>
          <h2 className="text-3xl font-bold text-sylva-50 mb-12">
            Three Ways I Work With Founders
          </h2>
          <div className="space-y-8">
            {SERVICES.map((service) => (
              <ServiceCard key={service.number} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
            My Framework
          </p>
          <h2 className="text-3xl font-bold text-sylva-50 mb-4">
            The GTM-6 Framework
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Every engagement is built on the same framework that powers my audit
            tool. Six dimensions, measured and optimized: Positioning, Copy, SEO,
            Lead Capture, Performance, and Visual Creative.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            Try the free audit to see it in action &rarr;
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-sylva-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-sylva-50 mb-10 text-center">
            What Founders Say
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.company}
                className="rounded-xl border border-border bg-white p-8"
              >
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-sylva-50">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-sylva-50 via-sylva-100 to-sylva-200">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-sylva-950 mb-4">
            Ready to Build Your GTM?
          </h2>
          <p className="text-sylva-400 mb-8">
            Let&apos;s start with a 30-minute strategy call. No pitch — just
            clarity.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-sylva-950 transition-all hover:bg-amber-400 btn-lift"
          >
            Book a Strategy Call
          </Link>
        </div>
      </section>
    </div>
  );
}
