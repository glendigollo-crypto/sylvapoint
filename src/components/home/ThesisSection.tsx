"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";

const THESES = [
  {
    number: "01",
    title: "Growth \u2260 Scaling",
    description:
      "Most startups rush to scale before they've built a narrative anyone cares about. Premature scaling kills more companies than bad products. Growth starts with clarity, not spend.",
    image: "/images/generated/thesis-growth.png",
  },
  {
    number: "02",
    title: "Narrative is Strategy",
    description:
      "Your technology doesn't sell itself. The story around it does. A compelling narrative turns features into movements and users into advocates.",
    image: "/images/generated/thesis-narrative.png",
  },
  {
    number: "03",
    title: "Trust is the Currency",
    description:
      "In AI, fintech, and greentech, trust isn't a nice-to-have — it's the entire business model. Build trust first, and the market follows.",
    image: "/images/generated/thesis-trust.png",
  },
];

export function ThesisSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-thesis]", {
        x: -40,
        opacity: 0,
        duration: 0.7,
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div ref={containerRef} className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
          Three GTM Truths
        </p>
        <h2 className="text-3xl font-bold text-sylva-50 mb-12">
          What I Believe
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {THESES.map((thesis) => (
            <div
              key={thesis.number}
              data-thesis
              className="relative pl-6 border-l-2 border-amber-500"
            >
              <div className="w-16 h-16 mb-4 rounded-lg overflow-hidden bg-sylva-900">
                <Image
                  src={thesis.image}
                  alt={thesis.title}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-4xl font-bold text-sylva-800">
                {thesis.number}
              </span>
              <h3 className="mt-2 text-xl font-bold text-sylva-50">
                {thesis.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {thesis.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
