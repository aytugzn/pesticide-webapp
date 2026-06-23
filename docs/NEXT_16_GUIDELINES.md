# Next.js 16.x Features & Guidelines

> **IMPORTANT CONTEXT FOR AI AGENTS**: This project is built on Next.js 16.x (released late 2025 / early 2026). The following features, breaking changes, and APIs are actively used in this codebase. **Do NOT assume Next.js 14 or 15 constraints.**

## 1. Network Boundary: `proxy.ts`
- **Replaces `middleware.ts`**: The `middleware.ts` file convention is deprecated and replaced by `proxy.ts`.
- **Runtime**: `proxy.ts` runs on the **Node.js runtime** (not the Edge runtime).
- **Impact**: You can directly use Node.js modules and libraries like `firebase-admin` inside `proxy.ts` without edge-compatibility issues.
- **Usage**: Export a default function named `proxy(request: NextRequest)`.

## 2. Caching: Cache Components & `use cache`
- **Opt-in Caching**: Caching is entirely opt-in. All dynamic code is executed at request time by default.
- **`use cache` Directive**: Used to cache pages, components, and functions. It leverages the compiler to automatically generate cache keys.
- **Config**: Enabled via `cacheComponents: true` in `next.config.ts`. (Replaces the old `experimental.ppr` and `experimental.dynamicIO` flags).

## 3. Improved Caching APIs
- **`revalidateTag()`**: Now **requires** a `cacheLife` profile as the second argument for stale-while-revalidate (SWR) behavior.
  - Example: `revalidateTag('blog-posts', 'max')` or `revalidateTag('products', { expire: 3600 })`.
- **`updateTag()`**: A new Server Actions-only API that provides read-your-writes semantics (expires and immediately reads fresh data within the same request).
- **`refresh()`**: A new Server Actions-only API for refreshing uncached data only, without touching the cache.

## 4. Routing and Navigation
- **`next/link` View Transitions**: The `<Link>` component now accepts a `transitionTypes` prop (e.g., `transitionTypes={['slide']}`) to trigger different animations based on navigation direction.
- **Layout Deduplication**: Shared layouts are downloaded only once during prefetching.
- **Incremental Prefetching**: Only parts not already in the cache are prefetched.

## 5. Development & Tooling
- **Turbopack**: Now the default bundler for all Next.js projects.
- **Filesystem Caching**: `turbopackFileSystemCacheForDev: true` caches compiler artifacts on disk for significantly faster restarts.
- **Bundle Analyzer**: Use `next experimental-analyze` for an interactive UI to inspect production bundles.
- **Node.js Debugger**: Use `next dev --inspect` and `next start --inspect` to attach the Node.js debugger.
- **DevTools MCP**: Integrated Model Context Protocol for AI agents to access routing, caching, unified logs, and detailed stack traces.

## 6. Error Handling
- **New Default Error Page**: Built-in 500 error page is redesigned.
- **Hydration Diff Indicator**: Error overlay explicitly shows `+ Client / - Server` diffs for hydration mismatches.
- **`unstable_catchError()`**: Provides granular control of error boundaries at the component level. Catches errors without interfering with framework APIs like `redirect()` or `notFound()`.
- **`unstable_retry()`**: Available in `error.tsx`. It calls `router.refresh()` and `reset()` within a `startTransition()` to refetch data and re-render the segment from the server.

## 7. Breaking Changes & Deprecations
- **Minimum Requirements**: Node.js 20.9.0+ and TypeScript 5.1.0+.
- **Sync Params/Cookies**: `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` MUST be accessed asynchronously (e.g., `await params`).
- **`next/image` Default Sizes**: The `minimumCacheTTL` defaults to 4 hours (14400s). `16` is removed from default `imageSizes`.
- **Linting**: `next build` no longer runs linting by default. Use ESLint directly.
- **Parallel Routes**: All parallel route slots now require explicit `default.js` files.

---
**Note to AI Agents**: When implementing new features, always refer to these Next.js 16.x paradigms, especially regarding `proxy.ts` for auth routing and `use cache` + `updateTag()` for Firestore integrations.
