"use client";

import { useEffect, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types (matching API response from /api/admin/leads)
// ---------------------------------------------------------------------------

interface Lead {
  id: string;
  email: string | null;
  name: string | null;
  url: string | null;
  website_url: string | null;
  source: string | null;
  nurture_status: string | null;
  audit_count: number | null;
  latest_audit_score: number | null;
  composite_score: number | null;
  created_at: string;
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Leads Page
// ---------------------------------------------------------------------------

export default function AdminLeadsPage() {
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter / pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search change
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/admin/leads?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to load leads");
        return;
      }

      const json: LeadsResponse = await res.json();
      setData(json);
    } catch {
      setError("Network error loading leads");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sylva-100">Leads</h1>
        {data && (
          <span className="text-sm text-sylva-500">
            {data.total.toLocaleString()} total
          </span>
        )}
      </div>

      {/* ---- Search bar ---- */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sylva-500"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full rounded-lg border border-sylva-700 bg-sylva-900 pl-10 pr-4 py-2 text-sm text-sylva-100 placeholder-sylva-600 focus:border-sylva-500 focus:outline-none focus:ring-1 focus:ring-sylva-500"
          />
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
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-sylva-500">
                  URL Audited
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-sylva-500 text-right">
                  Score
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
                      <div className="h-4 w-40 bg-sylva-800 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-48 bg-sylva-800 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-10 bg-sylva-800 rounded animate-pulse ml-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 bg-sylva-800 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 bg-sylva-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : data && data.leads.length > 0 ? (
                data.leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-sylva-800/50 hover:bg-sylva-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-sylva-200">
                      {lead.email ?? (
                        <span className="text-sylva-600 italic">No email</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-sylva-400 max-w-[200px] truncate">
                      {lead.url ?? lead.website_url ?? (
                        <span className="text-sylva-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-right">
                      <ScoreBadge
                        score={
                          lead.latest_audit_score ??
                          lead.composite_score ??
                          null
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={lead.nurture_status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-sylva-500">
                      {formatDate(lead.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-sylva-500"
                  >
                    {debouncedSearch
                      ? "No leads matching your search."
                      : "No leads found."}
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

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-sylva-600">--</span>;
  }

  const statusStyles: Record<string, string> = {
    new: "bg-blue-900/30 text-blue-400 border-blue-800",
    active: "bg-green-900/30 text-green-400 border-green-800",
    nurturing: "bg-amber-900/30 text-amber-400 border-amber-800",
    converted: "bg-sylva-800 text-sylva-300 border-sylva-700",
    unsubscribed: "bg-red-900/30 text-red-400 border-red-800",
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
