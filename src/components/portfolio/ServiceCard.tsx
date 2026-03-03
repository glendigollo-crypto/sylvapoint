"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface ServiceCardProps {
  number: string;
  title: string;
  duration: string;
  description: string;
  deliverables: string[];
  direction: "left" | "right";
}

export function ServiceCard({
  number,
  title,
  duration,
  description,
  deliverables,
  direction,
}: ServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(cardRef.current, {
        x: direction === "left" ? -50 : 50,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: cardRef }
  );

  return (
    <div
      ref={cardRef}
      className="rounded-xl border border-border bg-white p-8 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-6">
        <span className="text-5xl font-bold text-sylva-800 leading-none shrink-0">
          {number}
        </span>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-sylva-50">{title}</h3>
          <span className="inline-block mt-1 text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
            {duration}
          </span>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
          <ul className="mt-4 space-y-2">
            {deliverables.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="text-amber-500 mt-0.5 shrink-0">&#x2713;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
