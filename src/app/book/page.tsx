import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Book a GTM Strategy Call",
  description:
    "Book a free 30-minute GTM strategy call to discuss your audit results and get personalized advice.",
};

export default function BookPage() {
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK || "https://cal.com";

  return (
    <div className="min-h-screen bg-sylva-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-sylva-950 to-sylva-900 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-white">
              SylvaPoint
            </Link>
            <Link href="/" className="text-sm text-sylva-400 hover:text-white">
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-3">
              Book a Free GTM Strategy Call
            </h1>
            <p className="text-sylva-300 max-w-lg mx-auto">
              Get 30 minutes of personalized GTM advice based on your audit
              results. We&apos;ll walk through your scorecard and prioritize
              your next steps.
            </p>
          </div>

          {/* What to Expect */}
          <div className="grid gap-4 md:grid-cols-3 mb-10">
            {[
              {
                title: "Review Your Score",
                desc: "We'll walk through your GTM audit results dimension by dimension.",
              },
              {
                title: "Prioritize Actions",
                desc: "Identify the 3 highest-impact improvements for your business.",
              },
              {
                title: "Get a Roadmap",
                desc: "Leave with a clear 30-day plan to improve your GTM readiness.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-sylva-700 bg-sylva-900/50 p-5 text-center"
              >
                <h3 className="text-sm font-bold text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-sylva-400">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Cal.com Embed */}
          <div className="rounded-xl border border-sylva-700 bg-sylva-900/50 overflow-hidden">
            <iframe
              src={calLink}
              width="100%"
              height="630"
              frameBorder="0"
              className="w-full"
              title="Book a strategy call"
            />
          </div>

          <p className="text-center text-xs text-sylva-600 mt-4">
            No obligation. No credit card required. Just real GTM advice.
          </p>
        </div>
      </div>

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
