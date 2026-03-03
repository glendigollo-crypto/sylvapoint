import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ReportContent } from "./content";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

async function getAuditReport(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/audit/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: ReportPageProps): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAuditReport(id);

  if (!audit || audit.status !== "completed") {
    return { title: "GTM Full Report" };
  }

  const score = Math.round(audit.composite_score ?? 0);
  return {
    title: `Full GTM Report — ${score}/100`,
    description: `Detailed GTM audit report with findings, recommendations, and prioritized action plan.`,
  };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const audit = await getAuditReport(id);

  if (!audit) {
    notFound();
  }

  // If not unlocked, redirect to the scorecard page where the email gate lives
  if (audit.tier === "free") {
    redirect(`/audit/${id}`);
  }

  return <ReportContent slug={id} data={audit} />;
}
