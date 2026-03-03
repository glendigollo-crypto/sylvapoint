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
    <div className="min-h-screen bg-white">
      <div className="px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-sylva-50 mb-3">
              Strategy Consultation with Sylvia Ndunge
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              30 minutes of focused GTM strategy. Walk through your scorecard,
              identify your biggest growth levers, and leave with a clear action plan.
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
                className="rounded-xl border border-border bg-sylva-900 p-5 text-center"
              >
                <h3 className="text-sm font-bold text-sylva-50 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Cal.com Embed */}
          <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
            <iframe
              src={calLink}
              width="100%"
              height="630"
              frameBorder="0"
              className="w-full"
              title="Book a strategy call with Sylvia Ndunge"
            />
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            No obligation. No credit card required. Just real GTM advice.
          </p>
        </div>
      </div>
    </div>
  );
}
