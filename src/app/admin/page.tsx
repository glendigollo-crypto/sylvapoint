"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types (matching API response shape)
// ---------------------------------------------------------------------------

interface DashboardData {
  totalAudits: number;
  emailsCaptured: number;
  playbooksSold: number;
  revenueTotal: number;
  auditsPerDay: { date: string; count: number }[];
  scoreDistribution: { bucket: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard", {
          credentials: "include",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Failed to load dashboard");
          return;
        }

        const json: DashboardData = await res.json();
        setData(json);
      } catch {
        setError("Network error loading dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-sylva-100">Dashboard</h1>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-sylva-900 border border-sylva-800 p-6 animate-pulse"
            >
              <div className="h-3 w-24 bg-sylva-800 rounded mb-3" />
              <div className="h-8 w-16 bg-sylva-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-sylva-100">Dashboard</h1>
        <div className="rounded-xl bg-red-900/20 border border-red-800 p-6">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      label: "Total Audits",
      value: data.totalAudits.toLocaleString(),
      color: "text-sylva-300",
    },
    {
      label: "Emails Captured",
      value: data.emailsCaptured.toLocaleString(),
      color: "text-sylva-300",
    },
    {
      label: "Playbooks Sold",
      value: data.playbooksSold.toLocaleString(),
      color: "text-amber-400",
    },
    {
      label: "Revenue",
      value: `$${(data.revenueTotal / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-sylva-100">Dashboard</h1>

      {/* ---- Stat Cards ---- */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-sylva-900 border border-sylva-800 p-6"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-sylva-500">
              {stat.label}
            </p>
            <p className={`mt-2 text-3xl font-bold font-score ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ---- Charts row ---- */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Audits Per Day Bar Chart */}
        <AuditsPerDayChart data={data.auditsPerDay} />

        {/* Score Distribution Histogram */}
        <ScoreDistributionChart data={data.scoreDistribution} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audits Per Day — simple bar chart built with divs
// ---------------------------------------------------------------------------

function AuditsPerDayChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-xl bg-sylva-900 border border-sylva-800 p-6">
      <h2 className="text-sm font-semibold text-sylva-200 mb-4">
        Audits Per Day
        <span className="ml-2 text-xs font-normal text-sylva-500">
          (Last 30 days)
        </span>
      </h2>

      <div className="flex items-end gap-[3px] h-40">
        {data.map((entry) => {
          const heightPct = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
          return (
            <div
              key={entry.date}
              className="flex-1 group relative"
              style={{ height: "100%" }}
            >
              {/* Bar */}
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t bg-sylva-500 group-hover:bg-sylva-400 transition-colors min-h-[2px]"
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-sylva-800 border border-sylva-700 rounded-lg px-2 py-1 text-xs text-sylva-200 whitespace-nowrap shadow-lg">
                  <div className="font-medium">{entry.count} audits</div>
                  <div className="text-sylva-400">{entry.date}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels (show first, middle, last) */}
      <div className="flex justify-between mt-2 text-[10px] text-sylva-500">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Distribution — histogram
// ---------------------------------------------------------------------------

function ScoreDistributionChart({
  data,
}: {
  data: { bucket: string; count: number }[];
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const bucketColors: Record<string, string> = {
    "0-20": "bg-grade-f",
    "20-40": "bg-grade-d",
    "40-60": "bg-grade-c",
    "60-80": "bg-grade-b",
    "80-100": "bg-grade-a",
  };

  return (
    <div className="rounded-xl bg-sylva-900 border border-sylva-800 p-6">
      <h2 className="text-sm font-semibold text-sylva-200 mb-4">
        Score Distribution
      </h2>

      <div className="space-y-3">
        {data.map((bucket) => {
          const widthPct =
            maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
          const colorClass = bucketColors[bucket.bucket] ?? "bg-sylva-500";

          return (
            <div key={bucket.bucket} className="flex items-center gap-3">
              <span className="w-14 text-xs font-mono text-sylva-400 text-right shrink-0">
                {bucket.bucket}
              </span>
              <div className="flex-1 h-7 bg-sylva-800 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${colorClass} rounded-lg transition-all duration-500`}
                  style={{ width: `${Math.max(widthPct, 1)}%` }}
                />
              </div>
              <span className="w-8 text-xs font-mono text-sylva-300 text-right shrink-0">
                {bucket.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
