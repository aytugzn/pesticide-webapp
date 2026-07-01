# Next.js 16.x Features & Guidelines (16.0, 16.1, 16.2)

> **IMPORTANT CONTEXT FOR AI AGENTS**: This project is built on Next.js 16.x (released late 2025 / early 2026). The following features, breaking changes, and APIs are actively used in this codebase. **Do NOT assume Next.js 14 or 15 constraints.**

## 1. Network Boundary & Runtime Architecture

- **`proxy.ts` (formerly `middleware.ts`)**: The `middleware.ts` file convention is deprecated and replaced by `proxy.ts`. 
  - **Runtime**: It runs on the **Node.js runtime** (not the Edge runtime), meaning you can safely use Node.js modules like `firebase-admin` directly.
  - **Usage**: Export a default function named `proxy(request: NextRequest)`.

- **Async Params & Cookies (Breaking Change)**: Properties like `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` MUST be accessed asynchronously.
  - *Wrong:* `const id = params.id;`
  - *Right:* `const { id } = await params;`

- **Parallel Routes**: All parallel route slots (e.g., `@modal`) now require explicit `default.js` or `default.tsx` files. Builds will fail without them.

## 2. Caching: Cache Components & New APIs

- **Cache Components (Opt-in)**: Caching is entirely opt-in now. All dynamic code is executed at request time by default.
  - Enabled via `cacheComponents: true` in `next.config.ts` (replacing the old `experimental.ppr` and `experimental.dynamicIO` flags).
  - Use the `"use cache"` directive to cache pages, components, and functions, generating cache keys automatically via the compiler.

- **Refined Caching APIs**:
  - **`revalidateTag(tag, profile)`**: Now requires a `cacheLife` profile as the second argument (e.g., `'max'`, `'hours'`) for stale-while-revalidate (SWR) behavior.
  - **`updateTag(tag)`**: A new Server Actions-only API providing **read-your-writes** semantics (expires and immediately reads fresh data within the same request).
  - **`refresh()`**: A new Server Actions-only API for refreshing **uncached** data only, without touching the server cache.

## 3. Routing and Navigation Enhancements

- **Enhanced Routing**:
  - **Layout Deduplication**: Shared layouts are downloaded only once during prefetching.
  - **Incremental Prefetching**: Only parts not already in the cache are prefetched. Cancels requests when links leave the viewport.
  - **`experimental.prefetchInlining`**: Bundles all segment data for a route into a single response, reducing prefetch requests.
- **View Transitions (React 19.2)**: The `<Link>` component accepts a `transitionTypes` prop (e.g., `<Link href="/about" transitionTypes={['slide']}>`) to trigger animations based on direction.
- **Multiple Icon Formats**: Multiple icon files (e.g., `icon.png` and `icon.svg`) with the same base name are handled automatically for browser fallback support.

## 4. Development Experience (DX) & Tooling

- **Turbopack (Stable & Default)**: Now the default bundler for all Next.js projects.
  - Up to 2-5x faster production builds and ~400% faster `next dev` Time-to-URL startup.
  - **Filesystem Caching (Stable)**: Compiler artifacts are stored on disk for significantly faster compile times on restart (~10x faster).
- **Next.js Bundle Analyzer**: Run `next experimental-analyze` for an interactive UI to inspect production bundles, filter by route, and trace imports.
- **Next.js DevTools MCP**: Model Context Protocol integration allows AI agents to access routing, caching behavior, unified logs, and detailed stack traces directly.
- **Easier Debugging**: Pass `--inspect` to `next dev` AND `next start` to easily attach the Node.js debugger.
- **Server Function Logging**: Dev terminal logs Server Function execution, showing the function name, arguments, execution time, and file location.
- **Hydration Diff Indicator**: Hydration mismatch errors now explicitly show `+ Client / - Server` diffs.
- **Error Causes in Dev Overlay**: The error overlay displays `Error.cause` chains up to 5 levels deep.
- **External Dependencies**: Turbopack automatically handles transitive external dependencies in `serverExternalPackages` without warnings.

## 5. Error Handling & Recovery

- **New Default Error Page**: The built-in 500 error page shown in production has been redesigned.
- **`unstable_catchError()`**: Provides granular control of error boundaries at the component level. It integrates with Next.js out of the box, meaning it safely bypasses framework errors like `redirect()` and `notFound()`.
- **`unstable_retry()`**: Available via props in the `error.tsx` convention. It provides built-in retry logic by calling `router.refresh()` and `reset()` within a `startTransition()` to refetch data and re-render the segment from the server.

## 6. Performance Improvements

- **Faster Rendering (RSC)**: Server Components payload deserialization is up to 350% faster, leading to 25% to 60% faster rendering to HTML in real-world apps.
- **React Compiler (Stable)**: Enabled via `reactCompiler: true` in `next.config.ts`. Automatically memoizes components, reducing re-renders with zero manual code changes.
- **ImageResponse**: Generating images (like OG images) is 2x to 20x faster. It includes improved CSS/SVG coverage and now uses Geist Sans as the default font.

## 7. Breaking Changes & Removals

- **Minimum Requirements**: Node.js 22.0.0+ and TypeScript 5.1.0+.
- **Linting**: `next build` no longer runs linting by default. Use ESLint or Biome directly.
- **Removals**: AMP support and `experimental.ppr` have been completely removed.
- **`next/image` Defaults**: 
  - `minimumCacheTTL` changed from 60s to 4 hours (14400s).
  - The `16` size was removed from default `imageSizes`.
  - `images.qualities` defaults to `[75]`.
  - Security restriction blocks local IP optimization by default (`images.dangerouslyAllowLocalIP`).
- **Build Adapters API**: Stable API for deployment platforms to modify Next.js configuration or process build outputs.
