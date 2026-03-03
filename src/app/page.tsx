import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-sylva-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sylva-950 via-sylva-900 to-sylva-800" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Grade Your{" "}
              <span className="text-amber-400">Go-To-Market</span>
              <br />
              in 60 Seconds
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-lg text-sylva-200">
              The first automated GTM readiness audit. Score your website
              and social media presence across 6 dimensions based on frameworks
              from Dunford, Schwartz, Hormozi, and more.
            </p>
            <div className="mt-10">
              <Link
                href="/audit"
                className="inline-flex items-center rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-sylva-950 transition-colors hover:bg-amber-400"
              >
                Audit Your GTM — Free
              </Link>
              <p className="mt-3 text-sm text-sylva-300">
                No credit card. No email required. Results in 60 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Get */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-sylva-900">
            The GTM-6 Framework
          </h2>
          <p className="mt-4 text-center text-muted-foreground max-w-2xl mx-auto">
            Your website and social presence scored across 6 critical go-to-market dimensions
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Positioning & Messaging",
                desc: "Is your market position clear on your site and socials? Does your messaging resonate with ideal buyers across every channel?",
                icon: "Target",
              },
              {
                name: "Copy Effectiveness",
                desc: "Do your headlines and social posts convert? Is your copy compelling, specific, and human-written — on-site and off?",
                icon: "PenTool",
              },
              {
                name: "SEO & Content Quality",
                desc: "Can buyers find you on Google and social? Is your content authoritative, discoverable, and E-E-A-T compliant?",
                icon: "Search",
              },
              {
                name: "Lead Capture",
                desc: "Are you capturing demand from your site and social traffic? Lead magnets, CTAs, link-in-bio, and bridge offers?",
                icon: "Magnet",
              },
              {
                name: "Website Performance",
                desc: "Is your site fast, mobile-ready, accessible, and following best practices?",
                icon: "Gauge",
              },
              {
                name: "Visual & Creative",
                desc: "Do your visuals sell across web and social? Is your brand identity consistent, scroll-stopping, and professional?",
                icon: "Eye",
              },
            ].map((dim) => (
              <div
                key={dim.name}
                className="rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sylva-50 text-sylva-600">
                  <span className="text-2xl" aria-hidden="true">
                    {dim.icon === "Target" && "◎"}
                    {dim.icon === "PenTool" && "✎"}
                    {dim.icon === "Search" && "⌕"}
                    {dim.icon === "Magnet" && "⊛"}
                    {dim.icon === "Gauge" && "◉"}
                    {dim.icon === "Eye" && "◉"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-sylva-900">
                  {dim.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {dim.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-sylva-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-sylva-900">
            How It Works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Enter Your Details",
                desc: "Paste your website URL, add your social profiles, and tell us your business type.",
              },
              {
                step: "2",
                title: "AI Analysis",
                desc: "We crawl your site and social profiles, then analyze everything across 6 GTM dimensions.",
              },
              {
                step: "3",
                title: "Get Your Score",
                desc: "See your GTM scorecard with grades, gaps, and quick wins.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-xl font-bold text-sylva-950">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-sylva-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-sylva-900 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Your GTM has gaps. Let&apos;s find them.
          </h2>
          <p className="mt-4 text-sylva-200">
            Most businesses leave 40-60% of their GTM potential on the table
            — across their website and social channels.
            Find out where you stand in 60 seconds.
          </p>
          <Link
            href="/audit"
            className="mt-8 inline-flex items-center rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-sylva-950 transition-colors hover:bg-amber-400"
          >
            Start Your Free GTM Audit
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SylvaPoint. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
