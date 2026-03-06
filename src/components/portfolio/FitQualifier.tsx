"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Check, X, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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

function FitItem({
  text,
  index,
  type,
}: {
  text: string;
  index: number;
  type: "good" | "bad";
}) {
  const [hovered, setHovered] = useState(false);
  const isGood = type === "good";

  return (
    <motion.li
      initial={{ opacity: 0, x: isGood ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.4, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex items-start gap-4 py-3 px-4 rounded-lg transition-all duration-300 cursor-default"
      style={{
        background: hovered
          ? isGood
            ? "rgba(16, 185, 129, 0.06)"
            : "rgba(239, 68, 68, 0.06)"
          : "transparent",
      }}
    >
      {/* Index number */}
      <span
        className={`text-[10px] font-mono font-bold mt-1 shrink-0 w-5 text-right transition-colors duration-300 ${
          hovered
            ? isGood
              ? "text-grade-a"
              : "text-grade-f"
            : "text-sylva-600"
        }`}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Icon */}
      <span
        className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 ${
          isGood
            ? "bg-grade-a/10 text-grade-a group-hover:bg-grade-a group-hover:text-white"
            : "bg-grade-f/10 text-grade-f group-hover:bg-grade-f group-hover:text-white"
        }`}
      >
        {isGood ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
      </span>

      {/* Text */}
      <span
        className={`text-sm leading-relaxed transition-colors duration-300 ${
          hovered ? "text-sylva-50" : "text-sylva-400"
        }`}
      >
        {text}
      </span>

      {/* Hover indicator line */}
      <motion.div
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-full ${
          isGood ? "bg-grade-a" : "bg-grade-f"
        }`}
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: hovered ? "60%" : 0,
          opacity: hovered ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.li>
  );
}

export function FitQualifier() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"good" | "bad">("good");

  useGSAP(
    () => {
      gsap.from("[data-fit-header]", {
        y: 20,
        opacity: 0,
        duration: 0.6,
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
    <div ref={containerRef}>
      {/* Mobile: tab toggle */}
      <div className="md:hidden flex justify-center mb-6" data-fit-header>
        <div className="inline-flex rounded-lg bg-sylva-800 p-1">
          <button
            onClick={() => setActiveTab("good")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              activeTab === "good"
                ? "bg-white text-sylva-50 shadow-sm"
                : "text-sylva-400 hover:text-sylva-300"
            }`}
          >
            Good Fit
          </button>
          <button
            onClick={() => setActiveTab("bad")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              activeTab === "bad"
                ? "bg-white text-sylva-50 shadow-sm"
                : "text-sylva-400 hover:text-sylva-300"
            }`}
          >
            Not Right
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="relative glass-card-strong overflow-hidden">
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-grade-a/0 via-grade-a/40 to-grade-f/0" />

        <div className="grid md:grid-cols-2">
          {/* Good Fit Column */}
          <div
            className={`relative p-6 sm:p-8 lg:p-10 ${
              activeTab !== "good" ? "hidden md:block" : ""
            }`}
          >
            {/* Column header */}
            <div data-fit-header className="flex items-center gap-3 mb-8">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-grade-a/10 flex items-center justify-center">
                  <Check size={18} className="text-grade-a" strokeWidth={2.5} />
                </div>
                <div className="absolute -inset-1 rounded-xl bg-grade-a/5 blur-sm -z-10" />
              </div>
              <div>
                <h3 className="text-base font-bold text-sylva-50 tracking-tight">
                  We&apos;re a Good Fit If...
                </h3>
                <p className="text-xs text-sylva-500 mt-0.5">
                  Signals we look for
                </p>
              </div>
            </div>

            {/* Items */}
            <ul className="space-y-1">
              {GOOD_FIT.map((item, i) => (
                <FitItem key={item} text={item} index={i} type="good" />
              ))}
            </ul>

            {/* Bottom CTA hint */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="mt-8 pt-6 border-t border-sylva-700/50"
            >
              <a
                href="/work-with-me"
                className="inline-flex items-center gap-2 text-sm font-medium text-grade-a hover:text-grade-a/80 transition-colors group/cta"
              >
                Explore engagement paths
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover/cta:translate-x-1"
                />
              </a>
            </motion.div>
          </div>

          {/* Center divider — desktop only */}
          <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 z-10 flex-col items-center justify-center">
            <div className="w-px flex-1 bg-gradient-to-b from-transparent via-sylva-700/60 to-transparent" />
            <div className="my-3 w-8 h-8 rounded-full bg-white border border-sylva-700 shadow-sm flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-sylva-400">vs</span>
            </div>
            <div className="w-px flex-1 bg-gradient-to-b from-transparent via-sylva-700/60 to-transparent" />
          </div>

          {/* Not Fit Column */}
          <div
            className={`relative p-6 sm:p-8 lg:p-10 ${
              activeTab !== "bad" ? "hidden md:block" : ""
            }`}
          >
            {/* Subtle background difference */}
            <div className="absolute inset-0 bg-sylva-900/30 pointer-events-none" />

            <div className="relative">
              {/* Column header */}
              <div data-fit-header className="flex items-center gap-3 mb-8">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-grade-f/10 flex items-center justify-center">
                    <X size={18} className="text-grade-f" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -inset-1 rounded-xl bg-grade-f/5 blur-sm -z-10" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sylva-50 tracking-tight">
                    Not the Right Fit If...
                  </h3>
                  <p className="text-xs text-sylva-500 mt-0.5">
                    Better served elsewhere
                  </p>
                </div>
              </div>

              {/* Items */}
              <ul className="space-y-1">
                {NOT_FIT.map((item, i) => (
                  <FitItem key={item} text={item} index={i} type="bad" />
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      </div>
    </div>
  );
}
