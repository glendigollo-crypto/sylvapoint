"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Check, X } from "lucide-react";

const GOOD_FIT = [
  "You've built something real but the market doesn't get it yet",
  "You need positioning and narrative, not just marketing",
  "You're in AI, Fintech, or Greentech",
  "You want a strategic partner, not an agency",
  "You're post-MVP and pre-scale (or just raised)",
];

const NOT_FIT = [
  "You need someone to run Facebook ads",
  "You want a full-time CMO for the price of a consultant",
  "You're looking for vanity metrics, not revenue",
  "You need a website redesign (I architect GTM, not pixels)",
  "You want growth without doing the positioning work first",
];

export function FitQualifier() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-fit-col]", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.2,
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
    <div ref={containerRef} className="grid gap-8 md:grid-cols-2">
      <div data-fit-col className="rounded-xl border border-grade-a/20 bg-grade-a/5 p-8">
        <h3 className="text-lg font-bold text-sylva-50 mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-grade-a text-white">
            <Check size={16} />
          </span>
          We&apos;re a Good Fit If...
        </h3>
        <ul className="space-y-4">
          {GOOD_FIT.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-sm text-muted-foreground"
            >
              <Check size={16} className="text-grade-a mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div data-fit-col className="rounded-xl border border-grade-f/20 bg-grade-f/5 p-8">
        <h3 className="text-lg font-bold text-sylva-50 mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-grade-f text-white">
            <X size={16} />
          </span>
          Not the Right Fit If...
        </h3>
        <ul className="space-y-4">
          {NOT_FIT.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-sm text-muted-foreground"
            >
              <X size={16} className="text-grade-f mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
