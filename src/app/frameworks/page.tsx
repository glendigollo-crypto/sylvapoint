import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BlueprintCard } from "@/components/portfolio/BlueprintCard";

export const metadata: Metadata = {
  title: "Strategic Frameworks",
  description:
    "GTM frameworks and blueprints for startup founders. Go-to-market clarity, funding visibility, and community trust building.",
};

const BLUEPRINTS = [
  {
    title: "The Startup Go-to-Market Clarity Blueprint",
    subtitle: "Framework 01",
    image: "/images/generated/framework-gtm.png",
    problem:
      "You've built a real product but the market doesn't understand why it matters. Your positioning is unclear, your narrative is fragmented, and your GTM motion is ad hoc.",
    solution:
      "A 90-day structured process that takes you from 'we built this cool thing' to 'here's why the market needs us now.' Covers positioning, narrative architecture, ICP definition, channel strategy, and launch sequencing. Built on April Dunford's positioning framework, Eugene Schwartz's awareness levels, and Alex Hormozi's value equation.",
    audience:
      "Post-MVP, pre-scale founders in Web3, Fintech, or Greentech who have product traction but no repeatable GTM motion.",
    deliverables: [
      "Competitive positioning map and category design",
      "Core narrative framework (elevator to boardroom)",
      "Ideal Customer Profile with buyer persona docs",
      "Channel strategy and content calendar",
      "GTM launch sequence playbook",
      "Objection handling and sales enablement deck",
    ],
  },
  {
    title: "The Funding Moment Visibility Blueprint",
    subtitle: "Framework 02",
    image: "/images/generated/framework-funding.png",
    problem:
      "You just raised a round, but nobody outside your investors knows. The funding announcement gets 48 hours of attention, then silence. You need sustained visibility, not a press release.",
    solution:
      "A post-raise visibility system that turns your funding moment into 90 days of sustained market presence. PR strategy, thought leadership positioning, investor communications, and ecosystem partnerships — designed to convert funding attention into pipeline.",
    audience:
      "Founders who have recently closed a funding round (Seed to Series B) and want to maximize the market impact of their raise.",
    deliverables: [
      "Funding announcement comms strategy",
      "Thought leadership content calendar (90 days)",
      "Media outreach playbook with pitch templates",
      "Investor update template and cadence",
      "Market positioning refresh for new stage",
      "Partnership and ecosystem GTM plan",
    ],
  },
  {
    title: "The Early-Stage Community & Trust Blueprint",
    subtitle: "Framework 03",
    image: "/images/generated/framework-community.png",
    problem:
      "In Web3, fintech, and greentech, trust isn't optional — it's the product. You need community before you need customers, but you don't know how to build it without it feeling fake.",
    solution:
      "A trust-first community strategy that builds genuine market relationships before you need to sell. Developer relations, community governance, content-driven trust signals, and the infrastructure that turns community members into customers and advocates.",
    audience:
      "Early-stage founders building in trust-dependent markets (Web3, fintech, greentech, healthtech) who need community before revenue.",
    deliverables: [
      "Community strategy and governance framework",
      "Developer relations playbook (if applicable)",
      "Trust signal audit and optimization plan",
      "Content strategy for authority building",
      "Community-to-customer conversion funnel",
      "Advocacy and referral program design",
    ],
  },
];

export default function FrameworksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-sylva-50 via-sylva-100 to-sylva-200 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-4">
            Strategic Blueprints
          </p>
          <h1 className="text-4xl font-bold text-sylva-950 sm:text-5xl">
            Frameworks for Founders
          </h1>
          <p className="mt-6 text-lg text-sylva-400 max-w-2xl mx-auto">
            Battle-tested GTM frameworks built from working with dozens of
            startups across Web3, Fintech, and Greentech. Each blueprint is a
            complete system, not a checklist.
          </p>
        </div>
      </section>

      {/* Blueprints */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {BLUEPRINTS.map((blueprint) => (
            <BlueprintCard key={blueprint.title} {...blueprint} />
          ))}
        </div>
      </section>

      {/* Methodology Note */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-sylva-900">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
            Built on the GTM-6 Framework
          </p>
          <p className="text-muted-foreground leading-relaxed">
            These frameworks are built on the same GTM-6 methodology that powers
            the SylvaPoint audit tool. Every blueprint addresses all six
            dimensions: Positioning, Copy, SEO, Lead Capture, Performance, and
            Visual Creative.
          </p>
          <Link
            href="/audit"
            className="mt-6 inline-flex items-center text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            See your GTM-6 score for free &rarr;
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-sylva-50 mb-4">
            Want a Framework Applied to Your Business?
          </h2>
          <p className="text-muted-foreground mb-8">
            These blueprints become 10x more powerful when customized to your
            specific market, stage, and competitive landscape.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/work-with-me"
              className="rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-sylva-950 transition-all hover:bg-amber-400 btn-lift"
            >
              Work With Me
            </Link>
            <Link
              href="/book"
              className="rounded-lg border-2 border-border px-8 py-4 text-lg font-semibold text-sylva-50 transition-all hover:border-sylva-50"
            >
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
