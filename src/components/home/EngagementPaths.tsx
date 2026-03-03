"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { Search, BookOpen, Users } from "lucide-react";

const PATHS = [
  {
    icon: Search,
    image: "/images/generated/path-audit.png",
    tag: "Free",
    title: "Audit Your GTM",
    description:
      "Get an instant AI-powered scorecard across 6 dimensions. See where you're leaking revenue — in 60 seconds.",
    cta: "Start Free Audit",
    href: "/audit",
  },
  {
    icon: BookOpen,
    image: "/images/generated/path-playbook.png",
    tag: "Self-Serve",
    title: "Get Your Playbook",
    description:
      "Turn your audit results into an actionable GTM playbook. Step-by-step fixes prioritized by impact.",
    cta: "Learn More",
    href: "/audit",
  },
  {
    icon: Users,
    image: "/images/generated/path-consult.png",
    tag: "Done-With-You",
    title: "Hire Me",
    description:
      "Fractional GTM architect for your startup. 90-day engagements that build positioning, narrative, and market traction.",
    cta: "Work With Me",
    href: "/work-with-me",
  },
];

export function EngagementPaths() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-path-card]", {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-sylva-900">
      <div ref={containerRef} className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
            Three Ways to Start
          </p>
          <h2 className="text-3xl font-bold text-sylva-50">
            Choose Your Path
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {PATHS.map((path) => (
            <div
              key={path.title}
              data-path-card
              className="glass-card p-8 flex flex-col items-start"
            >
              <span className="inline-block text-xs font-semibold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full mb-4">
                {path.tag}
              </span>
              <div className="mb-4 w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={path.image}
                  alt={path.title}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="text-xl font-bold text-sylva-50">{path.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                {path.description}
              </p>
              <Link
                href={path.href}
                className="mt-6 inline-flex items-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-sylva-950 transition-all hover:bg-amber-400 btn-lift"
              >
                {path.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
