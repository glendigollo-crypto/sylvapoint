"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Download } from "lucide-react";

interface BlueprintCardProps {
  title: string;
  subtitle: string;
  image?: string;
  problem: string;
  solution: string;
  audience: string;
  deliverables: string[];
  downloadUrl?: string;
}

export function BlueprintCard({
  title,
  subtitle,
  image,
  problem,
  solution,
  audience,
  deliverables,
  downloadUrl,
}: BlueprintCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden hover:shadow-lg transition-shadow tilt-3d">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-8 flex items-start gap-6"
      >
        {image && (
          <div className="hidden sm:block w-24 h-18 rounded-lg overflow-hidden shrink-0">
            <Image
              src={image}
              alt={title}
              width={96}
              height={72}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">
            {subtitle}
          </p>
          <h3 className="text-xl font-bold text-sylva-50">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{problem}</p>
        </div>
        <ChevronDown
          size={20}
          className={`text-sylva-400 shrink-0 mt-1 transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-8 pb-8 space-y-6 border-t border-border pt-6">
          <div>
            <h4 className="text-sm font-semibold text-sylva-50 mb-2">
              The Solution
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {solution}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-sylva-50 mb-2">
              Who It&apos;s For
            </h4>
            <p className="text-sm text-muted-foreground">{audience}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-sylva-50 mb-3">
              Deliverables
            </h4>
            <ul className="space-y-2">
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

          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-2 mt-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amber-400 btn-lift"
            >
              <Download size={16} />
              Download Blueprint PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
