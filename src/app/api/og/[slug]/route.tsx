// ---------------------------------------------------------------------------
// Dynamic OG Image Generation — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Generates a 1200x630 Open Graph image for sharing audit scorecards.
// Uses @vercel/og (Satori) with edge runtime. All styling is inline.
// ---------------------------------------------------------------------------

import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

// ---------------------------------------------------------------------------
// Grade color mapping
// ---------------------------------------------------------------------------

function getGradeColor(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  switch (letter) {
    case "A":
      return "#22C55E"; // green
    case "B":
      return "#3B82F6"; // blue
    case "C":
      return "#F59E0B"; // amber
    case "D":
      return "#F97316"; // orange
    case "F":
      return "#EF4444"; // red
    default:
      return "#F59E0B";
  }
}

// ---------------------------------------------------------------------------
// Dimension labels (inline to avoid importing from non-edge-safe module)
// ---------------------------------------------------------------------------

const DIMENSION_LABELS: Record<string, string> = {
  positioning: "Positioning",
  copy: "Copy",
  seo: "SEO",
  lead_capture: "Lead Capture",
  performance: "Performance",
  visual: "Visual & UX",
};

const DIMENSION_ORDER = [
  "positioning",
  "copy",
  "seo",
  "lead_capture",
  "performance",
  "visual",
];

// ---------------------------------------------------------------------------
// Default fallback card
// ---------------------------------------------------------------------------

function renderDefaultCard(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A1F1C",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#8DD4C2",
            marginBottom: 16,
            display: "flex",
          }}
        >
          SylvaPoint
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: "#F59E0B",
            marginBottom: 12,
            display: "flex",
          }}
        >
          GTM Audit Scorecard
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#94A3B8",
            display: "flex",
          }}
        >
          Discover how your website performs across 6 GTM dimensions
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, immutable, max-age=86400",
      },
    }
  );
}

// ---------------------------------------------------------------------------
// GET /api/og/[slug]
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Create a lightweight Supabase client for edge runtime (read-only via anon key + RLS)
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return renderDefaultCard();
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select(
        "id, url, composite_score, composite_grade, status, business_type"
      )
      .eq("share_slug", slug)
      .single();

    if (auditError || !audit || audit.status !== "completed") {
      return renderDefaultCard();
    }

    // Fetch dimension scores
    const { data: dimensions } = await supabase
      .from("dimension_scores")
      .select("dimension_key, label, raw_score, grade")
      .eq("audit_id", audit.id)
      .order("dimension_key");

    const score = audit.composite_score ?? 0;
    const grade = audit.composite_grade ?? "N/A";
    const gradeColor = getGradeColor(grade);
    const auditUrl = audit.url || "unknown";

    // Build a dimension map for ordered rendering
    const dimMap: Record<
      string,
      { score: number; grade: string; label: string }
    > = {};
    if (dimensions) {
      for (const d of dimensions) {
        dimMap[d.dimension_key] = {
          score: Math.round(d.raw_score ?? 0),
          grade: d.grade ?? "?",
          label: d.label ?? DIMENSION_LABELS[d.dimension_key] ?? d.dimension_key,
        };
      }
    }

    // Truncate URL for display
    const displayUrl =
      auditUrl.length > 50 ? auditUrl.substring(0, 47) + "..." : auditUrl;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "row",
            backgroundColor: "#0A1F1C",
            color: "white",
            fontFamily: "sans-serif",
            padding: 48,
          }}
        >
          {/* Left side: branding + score */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "45%",
              paddingRight: 40,
            }}
          >
            {/* Top: brand */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#8DD4C2",
                  display: "flex",
                }}
              >
                SylvaPoint
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "#64748B",
                  marginTop: 4,
                  display: "flex",
                }}
              >
                GTM Audit Scorecard
              </div>
            </div>

            {/* Center: big score + grade */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 20,
              }}
            >
              <div
                style={{
                  fontSize: 140,
                  fontWeight: 900,
                  color: "#F59E0B",
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {score}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 800,
                    color: gradeColor,
                    lineHeight: 1,
                    display: "flex",
                  }}
                >
                  {grade}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: "#94A3B8",
                    marginTop: 4,
                    display: "flex",
                  }}
                >
                  out of 100
                </div>
              </div>
            </div>

            {/* Bottom: URL */}
            <div
              style={{
                fontSize: 16,
                color: "#64748B",
                display: "flex",
                overflow: "hidden",
              }}
            >
              {displayUrl}
            </div>
          </div>

          {/* Right side: dimension bars */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              width: "55%",
              gap: 16,
            }}
          >
            {DIMENSION_ORDER.map((key) => {
              const dim = dimMap[key];
              const dimScore = dim?.score ?? 0;
              const dimGrade = dim?.grade ?? "?";
              const dimLabel =
                dim?.label ?? DIMENSION_LABELS[key] ?? key;
              const barColor = getGradeColor(dimGrade);
              const barWidth = Math.max(dimScore, 3); // minimum visible bar

              return (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {/* Label row */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        color: "#CBD5E1",
                        fontWeight: 600,
                        display: "flex",
                      }}
                    >
                      {dimLabel}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: barColor,
                          display: "flex",
                        }}
                      >
                        {dimScore}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: barColor,
                          fontWeight: 600,
                          display: "flex",
                        }}
                      >
                        {dimGrade}
                      </div>
                    </div>
                  </div>
                  {/* Bar track */}
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: 12,
                      backgroundColor: "#1E3A36",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    {/* Bar fill */}
                    <div
                      style={{
                        display: "flex",
                        width: `${barWidth}%`,
                        height: "100%",
                        backgroundColor: barColor,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, immutable, max-age=86400",
        },
      }
    );
  } catch (error) {
    console.error("[og] Error generating OG image:", error);
    return renderDefaultCard();
  }
}
