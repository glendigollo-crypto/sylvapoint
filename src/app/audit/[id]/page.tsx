import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AuditResults } from "./results";

interface AuditResultsPageProps {
  params: Promise<{ id: string }>;
}

async function getAudit(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/audit/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: AuditResultsPageProps): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAudit(id);

  if (!audit || audit.status !== "completed") {
    return { title: "GTM Audit Results" };
  }

  const score = Math.round(audit.composite_score ?? 0);
  return {
    title: `GTM Score: ${score}/100`,
    description: `GTM audit results — scored ${score}/100 across positioning, copy, SEO, lead capture, performance, and visual creative.`,
    openGraph: {
      title: `GTM Audit Score: ${score}/100`,
      description: `Scored ${score}/100 on the GTM-6 Framework audit.`,
      images: [`/api/og/${id}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `GTM Score: ${score}/100`,
      images: [`/api/og/${id}`],
    },
  };
}

export default async function AuditResultsPage({
  params,
}: AuditResultsPageProps) {
  const { id } = await params;
  const audit = await getAudit(id);

  if (!audit) {
    notFound();
  }

  return <AuditResults slug={id} initialData={audit} />;
}
