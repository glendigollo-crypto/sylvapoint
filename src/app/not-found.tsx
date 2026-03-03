import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sylva-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-bold text-amber-400">404</p>
        <h1 className="mt-4 text-2xl font-bold text-white">
          Page not found
        </h1>
        <p className="mt-3 text-sylva-300">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-lg bg-amber-500 px-6 py-3 text-base font-semibold text-sylva-950 transition-colors hover:bg-amber-400"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
