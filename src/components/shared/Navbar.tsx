import Link from "next/link";

export function Navbar() {
  return (
    <nav className="border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-sylva-900">
            SylvaPoint
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/audit"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Audit
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/audit"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-sylva-950 transition-colors hover:bg-amber-400"
            >
              Free Audit
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
