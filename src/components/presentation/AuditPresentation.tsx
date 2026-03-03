"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import { DimensionSlide } from "./DimensionSlide";
import { CarouselNav } from "./CarouselNav";
import { IntelBriefing } from "./IntelBriefing";
import { FindingsTimeline } from "./FindingsTimeline";
import { FindingsCallout } from "./FindingsCallout";

interface DimensionData {
  dimension: string;
  label: string;
  score: number;
  grade: string;
  summaryFree?: string;
  findings?: Array<{
    title: string;
    severity: string;
    evidence: string;
    recommendation: string;
  }>;
  quickWins?: Array<{
    title: string;
    description: string;
    impact: string;
    effort: string;
  }>;
  illustrationUrl?: string | null;
}

interface GapData {
  dimension_key: string;
  label: string;
  score: number;
  grade: string;
  quick_win: string;
  summary_free?: string;
}

interface TeaserFinding {
  title: string;
  severity: string;
  dimension_label: string;
}

interface AuditPresentationProps {
  dimensions: DimensionData[];
  gaps: GapData[];
  teaserFindings?: TeaserFinding[];
  findingsCount: number;
  isUnlocked: boolean;
}

function gradeColorCSS(grade: string): string {
  if (grade.startsWith("A")) return "var(--grade-a)";
  if (grade.startsWith("B")) return "var(--grade-b)";
  if (grade.startsWith("C")) return "var(--grade-c)";
  if (grade.startsWith("D")) return "var(--grade-d)";
  return "var(--grade-f)";
}

export function AuditPresentation({
  dimensions,
  gaps,
  teaserFindings,
  findingsCount,
  isUnlocked,
}: AuditPresentationProps) {
  // Sort dimensions worst → best for narrative tension
  const sortedDimensions = [...dimensions].sort(
    (a, b) => a.score - b.score
  );

  // Desktop detection (SSR-safe: defaults to false → mobile/scroll mode)
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const isAnimating = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const entranceTimelines = useRef(new Map<number, gsap.core.Timeline>());
  const hasPlayedFirst = useRef(false);

  // Media query listener
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mql.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      // Reset carousel position when switching modes
      if (!e.matches && trackRef.current) {
        gsap.set(trackRef.current, { x: 0 });
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Collect entrance timelines from DimensionSlide children
  const handleTimelineReady = useCallback(
    (index: number, tl: gsap.core.Timeline) => {
      entranceTimelines.current.set(index, tl);

      // Auto-play first slide entrance once ready
      if (index === 0 && !hasPlayedFirst.current) {
        hasPlayedFirst.current = true;
        // Small delay to let layout settle
        requestAnimationFrame(() => {
          tl.restart();
        });
      }
    },
    []
  );

  // Navigate to a specific slide
  const navigateTo = useCallback(
    (targetIndex: number) => {
      if (
        isAnimating.current ||
        targetIndex === activeIndex ||
        targetIndex < 0 ||
        targetIndex >= sortedDimensions.length
      )
        return;

      isAnimating.current = true;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) {
        isAnimating.current = false;
        return;
      }

      const viewportWidth = viewport.offsetWidth;
      const slides = track.children;
      const currentSlide = slides[activeIndex] as HTMLElement | undefined;
      const targetSlide = slides[targetIndex] as HTMLElement | undefined;

      // Get illustration wrappers
      const currentIllust = currentSlide?.querySelector(
        `.slide-illust-${activeIndex}`
      ) as HTMLElement | null;
      const targetIllust = targetSlide?.querySelector(
        `.slide-illust-${targetIndex}`
      ) as HTMLElement | null;

      const navTl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false;
        },
      });

      // 1. Fade out current illustration
      if (currentIllust) {
        navTl.to(currentIllust, {
          opacity: 0,
          scale: 1.05,
          duration: 0.4,
          ease: "power2.in",
        });
      }

      // 2. Slide the track
      navTl.to(
        track,
        {
          x: -targetIndex * viewportWidth,
          duration: 0.6,
          ease: "power3.inOut",
        },
        currentIllust ? "-=0.2" : "0"
      );

      // 3. Fade in target illustration
      if (targetIllust) {
        // Reset target illustration to pre-entrance state
        gsap.set(targetIllust, { opacity: 0, scale: 0.95 });
        navTl.to(
          targetIllust,
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.3"
        );
      }

      // 4. Play entrance animations for target slide
      navTl.call(() => {
        const entranceTl = entranceTimelines.current.get(targetIndex);
        if (entranceTl) {
          entranceTl.restart();
        }
        setActiveIndex(targetIndex);
      }, [], "-=0.2");
    },
    [activeIndex, sortedDimensions.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isDesktop) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        navigateTo(activeIndex + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        navigateTo(activeIndex - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDesktop, activeIndex, navigateTo]);

  // Recalculate track position on resize
  useEffect(() => {
    if (!isDesktop) return;

    const handler = () => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;
      gsap.set(track, { x: -activeIndex * viewport.offsetWidth });
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isDesktop, activeIndex]);

  const gradeColors = sortedDimensions.map((d) => gradeColorCSS(d.grade));
  const labels = sortedDimensions.map((d) => d.label);

  return (
    <div>
      {isDesktop ? (
        /* ---- DESKTOP: Horizontal Carousel ---- */
        <div ref={viewportRef} className="carousel-viewport mb-12">
          <div ref={trackRef} className="carousel-track">
            {sortedDimensions.map((dim, i) => (
              <DimensionSlide
                key={dim.dimension}
                dimension={dim.dimension}
                label={dim.label}
                score={dim.score}
                grade={dim.grade}
                summaryFree={dim.summaryFree}
                findings={dim.findings?.map((f) => ({
                  title: f.title,
                  severity: f.severity,
                }))}
                illustrationUrl={dim.illustrationUrl}
                index={i}
                animationMode="carousel"
                onTimelineReady={handleTimelineReady}
              />
            ))}
          </div>

          <CarouselNav
            activeIndex={activeIndex}
            total={sortedDimensions.length}
            labels={labels}
            gradeColors={gradeColors}
            onNavigate={navigateTo}
            disabled={isAnimating.current}
          />
        </div>
      ) : (
        /* ---- MOBILE: Vertical Scroll ---- */
        <div className="presentation-container">
          {sortedDimensions.map((dim, i) => (
            <DimensionSlide
              key={dim.dimension}
              dimension={dim.dimension}
              label={dim.label}
              score={dim.score}
              grade={dim.grade}
              summaryFree={dim.summaryFree}
              findings={dim.findings?.map((f) => ({
                title: f.title,
                severity: f.severity,
              }))}
              illustrationUrl={dim.illustrationUrl}
              index={i}
              animationMode="scroll"
            />
          ))}
        </div>
      )}

      {/* 2. Intel Briefing — replaces revenue leaks cards */}
      {gaps.length > 0 && <IntelBriefing gaps={gaps} />}

      {/* 3. Findings Timeline — pre-gate only */}
      {!isUnlocked && teaserFindings && teaserFindings.length > 0 && (
        <FindingsTimeline
          findings={teaserFindings}
          remainingCount={Math.max(0, findingsCount - teaserFindings.length)}
        />
      )}

      {/* 4. Findings Callout — pre-gate only */}
      {!isUnlocked && findingsCount > 0 && (
        <FindingsCallout
          findingsCount={findingsCount}
          dimensionCount={dimensions.length}
        />
      )}
    </div>
  );
}
