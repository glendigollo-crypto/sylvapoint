"use client";

import { useEffect, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types (matching API response from /api/admin/audits)
// ---------------------------------------------------------------------------

interface Audit {
  id: string;
  url: string;
  business_type: string | null;
  status: string;
  composite_score: number | null;
  composite_grade: string | null;
  tier_unlocked: string | null;
  lead_email: string | null;
  created_at: string;
  completed_at: string | null;
}

interface AuditsResponse {
  audits: Audit[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

// ---------------------------------------------------------------------------
// Audits Page
// ---------------------------------------------------------------------------

export default function AdminAuditsPage() {
  const [data, setData] = useState<AuditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter / pagination state
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch data
  const fetchAudits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/admin/audits?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to load audits");
        return;
      }

      const json: AuditsResponse = await res.json();
      setData(json);
    } catch {
      setError("Network error loading audits");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sylva-100">Audits</h1>
        {data && (
          <span className="text-sm text-sylva-500">
            {data.total.toLocaleString()} total
          </span>
        )}
      </div>

      {/* ---- Filters ---- */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-sylva-700 bg-sylva-900 pl-3 pr-8 py-2 text-sm text-sylva-200 focus:border-sylva-500 focus:outline-none focus:ring-1 focus:ring-sylva-500 cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sylva-500 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* ---- Error ---- */}
      {error && (
        <div className="rounded-xl bg-red-900/20 border border-red-800 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ---- Table ---- */}
      <div className="rounded-xl bg-sylva-900 border border-sylva-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-sylva-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-sylva-500">
                  URL
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-sylva-500">
                  Business Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-sylva-500 text-right">
                  Score
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-sylva-500 text-center">
                  Grade
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-sylva-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-sylva-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                // Skeleton rows
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-sylva-800/50">
                    <td className="px-4 py-3">
                      <div className="h-4 w-48 bg-sylva-800 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 bg-sylva-800 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-10 bg-sylva-800 rounded animate-pulse ml-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 bg-sylva-800 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 bg-sylva-800 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 bg-sylva-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : data && data.audits.length > 0 ? (
                data.audits.map((audit) => (
                  <tr
                    key={audit.id}
                    className="border-b border-sylva-800/50 hover:bg-sylva-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-sylva-200 max-w-[250px] truncate">
                      {truncateUrl(audit.url)}
                    </td>
                    <td className="px-4 py-3 text-sm text-sylva-400">
                      {formatBusinessType(audit.business_type)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-right">
                      <ScoreBadge score={audit.composite_score} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <GradeBadge grade={audit.composite_grade} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <AuditStatusBadge status={audit.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-sylva-500">
                      {formatDate(audit.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-sylva-500"
                  >
                    {statusFilter
                      ? "No audits matching the selected filter."
                      : "No audits found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ---- Pagination ---- */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-sylva-800">
            <p className="text-xs text-sylva-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-sylva-700 bg-sylva-800 px-3 py-1.5 text-xs font-medium text-sylva-300 hover:bg-sylva-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-sylva-700 bg-sylva-800 px-3 py-1.5 text-xs font-medium text-sylva-300 hover:bg-sylva-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const display = u.hostname + (u.pathname !== "/" ? u.pathname : "");
    return display.length > 40 ? display.slice(0, 40) + "..." : display;
  } catch {
    return url.length > 40 ? url.slice(0, 40) + "..." : url;
  }
}

function formatBusinessType(type: string | null): string {
  if (!type) return "--";
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span className="text-sylva-600">--</span>;
  }

  let colorClass = "text-grade-f";
  if (score >= 80) colorClass = "text-grade-a";
  else if (score >= 60) colorClass = "text-grade-b";
  else if (score >= 40) colorClass = "text-grade-c";
  else if (score >= 20) colorClass = "text-grade-d";

  return <span className={`font-semibold ${colorClass}`}>{score}</span>;
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) {
    return <span className="text-sylva-600 text-sm">--</span>;
  }

  const letter = grade.charAt(0).toUpperCase();
  const gradeColorMap: Record<string, string> = {
    A: "bg-grade-a/20 text-grade-a border-grade-a/30",
    B: "bg-grade-b/20 text-grade-b border-grade-b/30",
    C: "bg-grade-c/20 text-grade-c border-grade-c/30",
    D: "bg-grade-d/20 text-grade-d border-grade-d/30",
    F: "bg-grade-f/20 text-grade-f border-grade-f/30",
  };

  const style =
    gradeColorMap[letter] ?? "bg-sylva-800 text-sylva-400 border-sylva-700";

  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold font-mono ${style}`}
    >
      {grade}
    </span>
  );
}

function AuditStatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    pending: "bg-amber-900/30 text-amber-400 border-amber-800",
    processing: "bg-blue-900/30 text-blue-400 border-blue-800",
    completed: "bg-green-900/30 text-green-400 border-green-800",
    failed: "bg-red-900/30 text-red-400 border-red-800",
  };

  const style =
    statusStyles[status.toLowerCase()] ??
    "bg-sylva-800 text-sylva-400 border-sylva-700";

  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}
