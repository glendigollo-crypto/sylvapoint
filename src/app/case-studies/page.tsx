import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Real results from working with Web3, Fintech, and Greentech founders. GTM transformations and growth stories.",
};

const CASE_STUDIES = [
  {
    company: "Hurupay",
    industry: "Web3 / Fintech",
    headline: "From technical whitepaper to market-ready positioning",
    result: "3x increase in qualified inbound leads within 60 days",
    challenge:
      "Hurupay had built a powerful cross-border payment solution for African remittances using blockchain rails, but their positioning read like a technical spec. Nobody outside the crypto space understood the value.",
    approach:
      "Rebuilt positioning around the user benefit (send money home in seconds, not days). Designed a narrative that spoke to diaspora communities, not developers. Created a GTM launch sequence targeting community leaders and fintech influencers.",
    metrics: [
      "3x qualified inbound leads",
      "GTM score improved from 38 to 74",
      "Conversion rate up 180%",
    ],
  },
  {
    company: "PeerCarbon",
    industry: "Greentech / Climate",
    headline: "Positioning a carbon marketplace for enterprise buyers",
    result: "Closed first enterprise pilot within 45 days of GTM relaunch",
    challenge:
      "PeerCarbon's peer-to-peer carbon credit marketplace had strong technology but was positioned for the wrong buyer. Their messaging attracted individual offsetters, not the enterprise buyers who drive volume.",
    approach:
      "Repositioned from B2C marketplace to B2B infrastructure. Built a compliance-first narrative that aligned with ESG reporting requirements. Created sales enablement materials that mapped to enterprise procurement processes.",
    metrics: [
      "First enterprise pilot in 45 days",
      "Pipeline value up 5x",
      "Sales cycle shortened by 40%",
    ],
  },
  {
    company: "Sankore 2.0",
    industry: "Web3 / Education",
    headline: "Building community trust in a skeptical market",
    result: "Grew engaged community from 200 to 2,000+ in 90 days",
    challenge:
      "Sankore 2.0 was building a blockchain-based education credentials platform for African universities, but Web3 skepticism in the education sector was the biggest barrier to adoption.",
    approach:
      "Designed a trust-first GTM strategy that led with the education mission, not the blockchain technology. Built partnerships with university innovation labs. Created content that demonstrated value through pilot results, not token mechanics.",
    metrics: [
      "Community grew 10x (200 to 2,000+)",
      "3 university pilot partnerships",
      "Media coverage in 5 African tech outlets",
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-sylva-50 via-sylva-100 to-sylva-200 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-4">
            Proof of Work
          </p>
          <h1 className="text-4xl font-bold text-sylva-950 sm:text-5xl">
            Results That Speak
          </h1>
          <p className="mt-6 text-lg text-sylva-400 max-w-2xl mx-auto">
            Real GTM transformations for real startups. Every engagement follows
            the same GTM-6 framework — because it works.
          </p>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-12">
          {CASE_STUDIES.map((cs, idx) => (
            <div
              key={cs.company}
              className="rounded-xl border border-border bg-white overflow-hidden"
            >
              {/* Header */}
              <div className="bg-sylva-900 p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-sylva-50">
                      {cs.company}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {cs.industry}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-sylva-50">
                  {cs.headline}
                </p>
                <p className="mt-2 text-amber-500 font-semibold text-sm">
                  {cs.result}
                </p>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-sylva-50 mb-2">
                    The Challenge
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cs.challenge}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-sylva-50 mb-2">
                    The Approach
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cs.approach}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-sylva-50 mb-3">
                    Key Results
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {cs.metrics.map((metric) => (
                      <span
                        key={metric}
                        className="inline-flex items-center rounded-full bg-grade-a/10 border border-grade-a/20 px-4 py-1.5 text-xs font-semibold text-grade-a"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-sylva-50 via-sylva-100 to-sylva-200">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-sylva-950 mb-4">
            Your Story Could Be Next
          </h2>
          <p className="text-sylva-400 mb-8">
            Every case study started with a 30-minute call. Let&apos;s see
            what&apos;s possible for your GTM.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/audit"
              className="rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-sylva-950 transition-all hover:bg-amber-400 btn-lift"
            >
              Start With a Free Audit
            </Link>
            <Link
              href="/book"
              className="rounded-lg border-2 border-sylva-600 px-8 py-4 text-lg font-semibold text-sylva-950 transition-all hover:border-sylva-50"
            >
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
