"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/audit", label: "GTM Audit" },
  { href: "/work-with-me", label: "Work With Me" },
  { href: "/frameworks", label: "Frameworks" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide on admin routes (admin has its own sidebar nav)
  if (pathname.startsWith("/admin")) return null;

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-sm border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/generated/sn-logo-hex.png"
                alt="SN"
                width={36}
                height={36}
                className="rounded-sm"
                priority
              />
              <span className="text-xl font-bold text-sylva-50">
                Sylvia Ndunge
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-sylva-300 hover:text-sylva-50 transition-colors rounded-lg hover:bg-sylva-900"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/book"
                className="ml-3 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-sylva-950 transition-all hover:bg-amber-400 btn-lift"
              >
                Book a Call
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-sylva-50 hover:bg-sylva-900 rounded-lg transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-lg font-bold text-sylva-100">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 text-sylva-300 hover:text-sylva-50 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-sylva-300 hover:text-sylva-50 hover:bg-sylva-900 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-border mt-4">
            <Link
              href="/book"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-sylva-950 hover:bg-amber-400 transition-colors"
            >
              Book a Call
            </Link>
          </div>
        </div>
      </div>

      {/* Spacer to push content below fixed navbar */}
      <div className="h-16" />
    </>
  );
}
