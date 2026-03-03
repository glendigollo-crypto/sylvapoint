"use client";

import { useState } from "react";

interface DimensionIllustrationProps {
  illustrationUrl?: string | null;
  grade: string;
  dimensionKey: string;
  className?: string;
}

function gradeGradient(grade: string): string {
  if (grade.startsWith("A"))
    return "linear-gradient(135deg, #0d3320 0%, #10B981 40%, #065f46 100%)";
  if (grade.startsWith("B"))
    return "linear-gradient(135deg, #1e2a4a 0%, #3B82F6 40%, #1e3a5f 100%)";
  if (grade.startsWith("C"))
    return "linear-gradient(135deg, #3d2e0a 0%, #F59E0B 40%, #78350f 100%)";
  if (grade.startsWith("D"))
    return "linear-gradient(135deg, #3d1a0a 0%, #F97316 40%, #7c2d12 100%)";
  return "linear-gradient(135deg, #3d0a0a 0%, #EF4444 40%, #7f1d1d 100%)";
}

export function DimensionIllustration({
  illustrationUrl,
  grade,
  dimensionKey,
  className = "",
}: DimensionIllustrationProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const showImage = illustrationUrl && !errored;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: gradeGradient(grade),
        minHeight: "280px",
      }}
    >
      {/* Gradient placeholder — always visible as base layer */}
      <div className="absolute inset-0 opacity-60">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Image layer — crossfades in */}
      {showImage && (
        <img
          src={illustrationUrl}
          alt={`${dimensionKey} dimension illustration`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
          style={{
            opacity: loaded ? 1 : 0,
            filter: loaded ? "none" : "blur(20px)",
          }}
        />
      )}

      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  );
}
