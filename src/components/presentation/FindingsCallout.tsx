"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface FindingsCalloutProps {
  findingsCount: number;
  dimensionCount: number;
}

export function FindingsCallout({
  findingsCount,
  dimensionCount,
}: FindingsCalloutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!counterRef.current) return;

      const counter = { val: 0 };
      gsap.to(counter, {
        val: findingsCount,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = String(Math.round(counter.val));
          }
        },
      });

      // Glow line pulse
      gsap.fromTo(
        ".callout-glow-line",
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          delay: 0.8,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="py-16 px-4">
      <div className="mx-auto max-w-3xl text-center">
        <div className="relative inline-block">
          <span
            ref={counterRef}
            className="font-score text-6xl md:text-7xl font-bold"
            style={{ color: "var(--amber-500)" }}
          >
            0
          </span>
        </div>
        <p className="mt-3 text-lg text-sylva-300">
          findings across{" "}
          <span
            className="font-score font-bold"
            style={{ color: "var(--amber-400)" }}
          >
            {dimensionCount}
          </span>{" "}
          dimensions
        </p>

        {/* Pulsing glow line leading to email gate */}
        <div className="mt-8 flex justify-center">
          <div
            className="callout-glow-line h-px w-48 origin-center"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--amber-500), transparent)",
              boxShadow: "0 0 20px rgba(255,77,77,0.3)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
