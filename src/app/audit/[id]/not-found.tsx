import Link from "next/link";

export default function AuditNotFound() {
  return (
    <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-bold text-amber-400">404</p>
        <h1 className="mt-4 text-2xl font-bold text-white">
          Audit not found
        </h1>
        <p className="mt-3 text-sylva-300">
          This audit doesn&apos;t exist or has been removed.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/audit"
            className="inline-flex items-center rounded-lg bg-amber-500 px-6 py-3 text-base font-semibold text-sylva-950 transition-colors hover:bg-amber-400"
          >
            Start New Audit
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-sylva-700 px-6 py-3 text-base font-semibold text-sylva-200 transition-colors hover:bg-sylva-900"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
