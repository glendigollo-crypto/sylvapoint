"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const CLIENTS = [
  "Hurupay",
  "PeerCarbon",
  "Sankore 2.0",
  "Harmonic Guild",
  "Kictanet",
];

export function LogoStrip() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-logo]", {
        opacity: 0,
        y: 12,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
          once: true,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-sylva-900">
      <div ref={containerRef} className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8">
          Trusted by Pioneers
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {CLIENTS.map((name) => (
            <div
              key={name}
              data-logo
              className="flex items-center justify-center h-10 px-5 rounded-lg bg-white border border-border text-sm font-semibold text-sylva-400 grayscale hover:grayscale-0 hover:text-sylva-50 transition-all duration-300"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
