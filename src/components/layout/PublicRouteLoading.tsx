import { DICTIONARY } from "@/constants/dictionary";

/** Provides the required Suspense fallback for runtime dynamic params. */
export const PublicRouteLoading = () => (
  <div
    className="flex min-h-64 flex-1 items-center justify-center bg-surface-neutral"
    aria-busy="true"
    aria-live="polite"
  >
    <span className="text-sm font-medium text-text-muted">
      {DICTIONARY.global.loading}
    </span>
  </div>
);
