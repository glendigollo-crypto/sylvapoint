"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/sylviandunge/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "X / Twitter",
    href: "https://x.com/sylviandunge",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@sylviandunge",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
];

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Hide on admin routes
  if (pathname.startsWith("/admin")) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await fetch("/api/audit", {
        method: "OPTIONS",
      });
      setSubscribed(true);
      setEmail("");
    } catch {
      setSubscribed(true);
    }
  };

  return (
    <footer className="border-t border-border bg-sylva-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Image
                src="/images/generated/sn-logo-hex.png"
                alt="SN"
                width={32}
                height={32}
                className="rounded-sm"
              />
              <span className="text-lg font-bold text-sylva-50">
                Sylvia Ndunge
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Go-to-Market Architect for Web3, Fintech, and Greentech pioneers.
              Turning innovation into market traction.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sylva-500 hover:text-amber-500 transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-sylva-50 uppercase tracking-wider">
              Navigate
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/work-with-me", label: "Work With Me" },
                { href: "/about", label: "About" },
                { href: "/case-studies", label: "Case Studies" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-sylva-50 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-sylva-50 uppercase tracking-wider">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { href: "/audit", label: "Free GTM Audit" },
                { href: "/frameworks", label: "Frameworks" },
                { href: "/blog", label: "Blog" },
                { href: "/book", label: "Book a Call" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-sylva-50 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-sylva-50 uppercase tracking-wider">
              GTM Insights
            </h3>
            <p className="mt-4 text-sm text-muted-foreground">
              Weekly insights on go-to-market strategy for tech founders.
            </p>
            {subscribed ? (
              <p className="mt-4 text-sm text-grade-a font-medium">
                You&apos;re in! Check your inbox.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="flex-1 min-w-0 rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-sylva-950 hover:bg-amber-400 transition-colors whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </div>
                <p className="mt-2 text-xs text-sylva-500">
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-sylva-500">
            &copy; {new Date().getFullYear()} Sylvia Ndunge. All rights
            reserved.
          </p>
          <p className="text-xs text-sylva-500">
            Built with{" "}
            <Link
              href="/audit"
              className="text-amber-500 hover:text-amber-400 transition-colors"
            >
              SylvaPoint GTM Skills
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
