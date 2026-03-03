import { Suspense } from "react";
import { AuditLoadingContent } from "./content";

export default function AuditLoadingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sylva-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-2xl text-amber-500">⟳</div>
            <p className="mt-4 text-sylva-300">Loading...</p>
          </div>
        </div>
      }
    >
      <AuditLoadingContent />
    </Suspense>
  );
}
