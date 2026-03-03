"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselNavProps {
  activeIndex: number;
  total: number;
  labels: string[];
  gradeColors: string[];
  onNavigate: (index: number) => void;
  disabled?: boolean;
}

export function CarouselNav({
  activeIndex,
  total,
  labels,
  gradeColors,
  onNavigate,
  disabled = false,
}: CarouselNavProps) {
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === total - 1;

  return (
    <>
      {/* Prev button */}
      {!isFirst && (
        <button
          className="carousel-nav-btn left-3 md:left-5"
          onClick={() => onNavigate(activeIndex - 1)}
          disabled={disabled}
          aria-label="Previous dimension"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next button */}
      {!isLast && (
        <button
          className="carousel-nav-btn right-3 md:right-5"
          onClick={() => onNavigate(activeIndex + 1)}
          disabled={disabled}
          aria-label="Next dimension"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Dot indicators */}
      <div className="carousel-dots">
        {Array.from({ length: total }, (_, i) => {
          const isActive = i === activeIndex;
          const color = gradeColors[i] || "var(--sylva-400)";
          return (
            <button
              key={i}
              className={`carousel-dot ${isActive ? "active" : ""}`}
              style={
                isActive
                  ? {
                      backgroundColor: color,
                      boxShadow: `0 0 8px ${color}, 0 0 16px ${color}40`,
                    }
                  : undefined
              }
              onClick={() => onNavigate(i)}
              disabled={disabled || isActive}
              aria-label={labels[i] || `Slide ${i + 1}`}
              title={labels[i] || `Slide ${i + 1}`}
            />
          );
        })}
      </div>
    </>
  );
}
