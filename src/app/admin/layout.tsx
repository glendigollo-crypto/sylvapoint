"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ---------------------------------------------------------------------------
// Login Form
// ---------------------------------------------------------------------------

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sylva-950">
      <div className="w-full max-w-sm rounded-xl bg-sylva-900 border border-sylva-700 p-8 shadow-lg">
        <h1 className="text-xl font-bold text-sylva-100 mb-1">
          SylvaPoint Admin
        </h1>
        <p className="text-sm text-sylva-400 mb-6">
          Sign in to access the dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium text-sylva-300 mb-1"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-sylva-600 bg-sylva-800 px-3 py-2 text-sm text-sylva-100 placeholder-sylva-500 focus:border-sylva-400 focus:outline-none focus:ring-1 focus:ring-sylva-400"
              placeholder="admin@sylvapoint.com"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-sylva-300 mb-1"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-sylva-600 bg-sylva-800 px-3 py-2 text-sm text-sylva-100 placeholder-sylva-500 focus:border-sylva-400 focus:outline-none focus:ring-1 focus:ring-sylva-400"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sylva-500 px-4 py-2 text-sm font-semibold text-sylva-50 hover:bg-sylva-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar nav items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: ChartIcon },
  { href: "/admin/leads", label: "Leads", icon: UsersIcon },
  { href: "/admin/audits", label: "Audits", icon: ClipboardIcon },
];

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Admin Layout (with auth gate)
// ---------------------------------------------------------------------------

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<
    "checking" | "unauthenticated" | "authenticated"
  >("checking");

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard", {
        credentials: "include",
      });
      if (res.status === 401) {
        setAuthState("unauthenticated");
      } else {
        setAuthState("authenticated");
      }
    } catch {
      setAuthState("unauthenticated");
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Loading state
  if (authState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sylva-950">
        <div className="text-sylva-400 text-sm">Checking authentication...</div>
      </div>
    );
  }

  // Login gate
  if (authState === "unauthenticated") {
    return <LoginForm onSuccess={() => setAuthState("authenticated")} />;
  }

  // Authenticated layout with sidebar
  return (
    <div className="min-h-screen bg-sylva-950 flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-sylva-800 bg-sylva-900 flex flex-col">
        <div className="px-5 py-5 border-b border-sylva-800">
          <span className="text-lg font-bold text-sylva-100 tracking-tight">
            SylvaPoint
          </span>
          <span className="ml-1.5 text-xs font-medium text-sylva-500 uppercase tracking-wider">
            Admin
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sylva-700 text-sylva-100"
                    : "text-sylva-400 hover:bg-sylva-800 hover:text-sylva-200"
                }`}
              >
                <item.icon
                  className={isActive ? "text-sylva-300" : "text-sylva-500"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sylva-800">
          <button
            onClick={async () => {
              // Clear the cookie by calling a simple logout or just clearing it client-side
              document.cookie =
                "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              setAuthState("unauthenticated");
            }}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-sylva-500 hover:bg-sylva-800 hover:text-sylva-300 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
