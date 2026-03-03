import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <span className="text-lg font-bold text-sylva-900">SylvaPoint</span>
            <p className="mt-2 text-sm text-muted-foreground">
              The first automated GTM readiness audit tool.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-sylva-900">Product</h3>
            <ul className="mt-2 space-y-2">
              <li>
                <Link href="/audit" className="text-sm text-muted-foreground hover:text-foreground">
                  Free Audit
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/book" className="text-sm text-muted-foreground hover:text-foreground">
                  Book a Call
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-sylva-900">Company</h3>
            <ul className="mt-2 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} SylvaPoint
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
