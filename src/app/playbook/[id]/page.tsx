import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PlaybookPurchase } from "./purchase";

interface PlaybookPageProps {
  params: Promise<{ id: string }>;
}

async function getAuditForPlaybook(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/audit/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: PlaybookPageProps): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAuditForPlaybook(id);

  if (!audit || audit.status !== "completed") {
    return { title: "Get Your GTM Playbook" };
  }

  const score = Math.round(audit.composite_score ?? 0);
  return {
    title: `GTM Playbook — Score: ${score}/100`,
    description: `Personalized GTM playbook with actionable strategies based on your ${score}/100 audit score.`,
  };
}

export default async function PlaybookPage({ params }: PlaybookPageProps) {
  const { id } = await params;
  const audit = await getAuditForPlaybook(id);

  if (!audit || audit.status !== "completed") {
    notFound();
  }

  return <PlaybookPurchase slug={id} audit={audit} />;
}
