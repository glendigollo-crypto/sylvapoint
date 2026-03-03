"use client";

import Link from "next/link";

interface AuditErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuditErrorPage({ error, reset }: AuditErrorPageProps) {
  return (
    <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">
          Audit failed to load
        </h1>
        <p className="mt-3 text-sylva-300">
          {error.message ||
            "We couldn't load this audit. It may still be processing or something went wrong."}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center rounded-lg bg-amber-500 px-6 py-3 text-base font-semibold text-sylva-950 transition-colors hover:bg-amber-400"
          >
            Try Again
          </button>
          <Link
            href="/audit"
            className="inline-flex items-center rounded-lg border border-sylva-700 px-6 py-3 text-base font-semibold text-sylva-200 transition-colors hover:bg-sylva-900"
          >
            Start New Audit
          </Link>
        </div>
      </div>
    </div>
  );
}
