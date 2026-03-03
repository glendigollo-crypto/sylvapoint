"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface RadarDimension {
  label: string;
  score: number;
  grade: string;
}

interface RadarChartProps {
  dimensions: RadarDimension[];
  size?: number;
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "var(--grade-a)";
  if (grade.startsWith("B")) return "var(--grade-b)";
  if (grade.startsWith("C")) return "var(--grade-c)";
  if (grade.startsWith("D")) return "var(--grade-d)";
  return "var(--grade-f)";
}

function hexVertex(cx: number, cy: number, r: number, i: number) {
  const angle = (i * 60 - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function hexPath(cx: number, cy: number, r: number): string {
  return (
    Array.from({ length: 6 }, (_, i) => {
      const { x, y } = hexVertex(cx, cy, r, i);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ") + " Z"
  );
}

export function RadarChart({ dimensions, size = 400 }: RadarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<SVGPathElement>(null);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = dimensions.map((dim, i) => {
    const r = (dim.score / 100) * maxR;
    return hexVertex(cx, cy, r, i);
  });

  const dataPath =
    dataPoints
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ") + " Z";

  const labelR = maxR + 30;

  useGSAP(
    () => {
      if (!polygonRef.current) return;

      // Polygon: scale from center
      gsap.from(polygonRef.current, {
        scale: 0,
        opacity: 0,
        duration: 1,
        ease: "power2.out",
        svgOrigin: `${cx} ${cy}`,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
      });

      // Dots: pop in with subtle overshoot
      gsap.from(".radar-dot", {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        stagger: 0.06,
        ease: "back.out(1.5)",
        delay: 0.5,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="flex justify-center"
      aria-label="GTM-6 radar chart"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        role="img"
        aria-label="Hexagonal radar chart showing six GTM dimension scores"
      >
        <defs>
          <linearGradient
            id="radar-fill-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(245,158,11,0.25)" />
            <stop offset="100%" stopColor="rgba(245,158,11,0.08)" />
          </linearGradient>
        </defs>

        {/* Grid hexagons */}
        {gridLevels.map((level) => (
          <path
            key={level}
            d={hexPath(cx, cy, maxR * level)}
            fill="none"
            stroke="var(--sylva-700)"
            strokeWidth={level === 1 ? 1.5 : 0.8}
            opacity={level === 1 ? 0.6 : 0.3}
          />
        ))}

        {/* Axis lines */}
        {Array.from({ length: 6 }, (_, i) => {
          const { x, y } = hexVertex(cx, cy, maxR, i);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--sylva-700)"
              strokeWidth={0.8}
              opacity={0.3}
            />
          );
        })}

        {/* Data polygon */}
        <path
          ref={polygonRef}
          d={dataPath}
          fill="url(#radar-fill-grad)"
          stroke="var(--amber-500)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            className="radar-dot"
            cx={p.x}
            cy={p.y}
            r={5}
            fill={getGradeColor(dimensions[i].grade)}
            stroke="var(--sylva-950)"
            strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {dimensions.map((dim, i) => {
          const { x, y } = hexVertex(cx, cy, labelR, i);
          const anchor =
            x < cx - 10 ? "end" : x > cx + 10 ? "start" : "middle";
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="central"
              className="fill-sylva-300 text-[11px]"
            >
              {dim.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
