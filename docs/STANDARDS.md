# DMR İlaçlama - Engineering Manifesto & Coding Standards

> **CRITICAL INSTRUCTION FOR ALL AI AGENTS:** You are operating in a highly structured, strict, and modern Next.js 16 codebase. Deviating from the standards defined in this document is strictly prohibited. Before writing any code, modifying features, or handling errors, you MUST read and comply with these rules.

---

## 1. Project Architecture (Feature-Sliced Design)
We use a feature-sliced architecture. Code is not grouped by technical type (e.g., all components together, all hooks together) but by business feature.
- **`src/features/[feature-name]/`**: Contains everything related to a specific domain (e.g., `auth`, `home`, `combinations`, `pests`).
  - `actions.ts`: Next.js Server Actions for this feature.
  - `components/`: UI components specific to this feature.
  - `types.ts`: TypeScript interfaces and error codes.
  - `schemas.ts`: Zod validation schemas.
- **`src/components/ui/`**: Only dumb, reusable, generic UI components (Button, Input, Modal).
- **`src/components/layout/`**: Global layout components (Navbar, Footer, Sidebar).

## 2. Server Components vs. Client Components
- **Server-First Approach**: Default to React Server Components (RSC). Do not use `"use client"` unless the component explicitly requires React hooks (`useState`, `useEffect`), DOM APIs, or event listeners (`onClick`).
- **Data Fetching**: Fetch data in Server Components or Server Actions. Do NOT use `useEffect` or `react-query` to fetch initial data on the client.
- **Action Imports**: Server Actions must be defined in `actions.ts` files with the `"use server"` directive at the top.

## 3. Strict Error Handling & Logging
We have a centralized, highly strict error handling architecture.
- **No Native Errors**: Do NOT use `throw new Error("message")`. 
- **`AppError` Class**: All thrown errors must be an instance of `AppError` (`src/lib/exceptions.ts`).
- **`DICTIONARY` Pattern**: Every single hardcoded text, log message, or error message MUST be pulled from `src/constants/dictionary.ts`. No string literals are allowed.
- **Structured Logging**: When logging errors with dynamic data, use objects: `console.error(DICTIONARY.systemErrors.apiFailed, { status })`.
- **Global Boundary**: Unhandled errors are caught by `src/app/global-error.tsx` which uses Next.js 16's `unstable_retry()`.

## 4. Server Actions & Type Safety
- **Return Types**: Every Server Action must return a unified, strongly-typed response using the generic `ActionResponse<T, E>` from `src/types/index.ts`.
  - *Success*: `return { success: true, data: { ... } };`
  - *Error*: `return { success: false, error: FEATURE_ERRORS.SOME_ERROR };`
- **Validation**: Form inputs and API parameters MUST be validated using **Zod** schemas before processing.
- **No `any`**: The use of `any` is strictly prohibited. Use `Record<string, unknown>` when mapping raw Firestore data, and explicitly parse properties.
- **Immutability**: Use the `deepFreeze` utility (`src/utils/deep-freeze.ts`) when exporting constant objects (like `DICTIONARY` or `ROUTES`).

## 5. Caching & Data Mutation (Next.js 16)
- **Read-Your-Writes**: Inside Server Actions, always use `updateTag("tag-name")` to ensure the cache expires and fresh data is read in the same request. Do NOT use `revalidateTag` for user-triggered mutations.
- **Cache Components**: Use the top-level `cacheComponents: true` config and the `"use cache"` directive inside page components.
- **Uncached Data**: Use `refresh()` from `next/cache` inside Server Actions to refresh client-side UI without touching the server cache.

## 6. UI, Design & Tailwind CSS v4
- **CSS Variables Only**: Do NOT use raw color values like `text-white` or `bg-red-500`. We use Tailwind v4 CSS variables defined in `globals.css`.
  - *Wrong:* `className="text-white bg-blue-600"`
  - *Correct:* `className="text-brand-surface bg-brand-primary"`
- **Semantic Classes**: Use `text-text-primary`, `text-text-muted`, `bg-surface-neutral`, `border-brand-border`, `text-error-text`.
- **Aesthetics**: UI must be modern, premium, and dynamic. Utilize glassmorphism, subtle micro-animations (hover/active states), and curated typography.
- **Images**: Use `next/image` exclusively. For external images (Cloudinary, Google), ensure `remotePatterns` are configured in `next.config.ts`.

## 7. Firestore & Database Standards
- **English Schema**: All Firestore schema collections and fields must be strictly in English.
  - *Collections:* `regions`, `pests`, `combinations`, `serviceReports`, `messages`, `reviews`, `settings`.
  - *Fields:* `isActive` (not aktif), `name` (not ad), `description` (not özellikler).
- **Client vs Admin**: Use `firebase-admin` (Server SDK) ONLY in Server Actions, `proxy.ts`, and Server Components. Use `firebase` (Client SDK) ONLY if absolutely necessary in Client Components (we prefer Server Actions for DB operations).

## 8. Authentication & Security
- **Firebase Auth**: Admin panel uses Google OAuth -> Firebase Auth -> Session Cookies.
- **Middleware Boundary**: `proxy.ts` (Next.js 16 Node.js runtime middleware) intercepts all `/admin/*` routes to verify the `admin_session` cookie via `firebase-admin`.
- **Whitelist**: Only the email defined in `ADMIN_EMAIL` environment variable can create a session.

## 9. AI Integration (Gemini 2.0)
- **Prompt Isolation**: NEVER pass the entire database context to the AI. Pass only strictly necessary `description` strings to prevent token overflow.
- **JSON Parsing**: NEVER parse Gemini responses directly. All AI responses MUST be passed through the `extractAndParseJson` utility (`src/utils/parsers.ts`) which guarantees markdown stripping and structural validation before JSON execution.

## 10. SEO & Meta Standards (100% SEO Focus)
> **CORE DIRECTIVE**: SEO is the absolute highest priority of this project. You MUST apply every possible modern SEO best practice, even if not explicitly listed here. This includes optimizing Core Web Vitals (LCP, CLS), ensuring flawless internal linking, using semantic URLs, and maximizing crawlability.
- **Metadata**: Every public page MUST export `generateMetadata` fetching data directly from Firestore.
- **Semantic HTML**: UI must be built with strict HTML5 semantics. Use `<article>`, `<section>`, `<nav>`, `<aside>`, `<main>`, and `<header>` instead of arbitrary `<div>` tags wherever logically appropriate. Heading hierarchy (`<h1>` to `<h4>`) MUST be strictly sequential.
- **Accessibility (A11y)**: 
  - ALL interactive elements (buttons, links) without readable text MUST have an `aria-label`.
  - ALL decorative icons and background elements MUST have `aria-hidden="true"`.
  - ALL images MUST have descriptive `alt` tags.
- **Structured Data**: Standard Schema.org JSON-LD (LocalBusiness, Service, FAQPage) MUST be injected into the DOM of every public route.
- **Canonical URLs**: `alternates: { canonical: '...' }` MUST be implemented on all public pages once dynamic routing slugs are finalized to prevent duplicate content penalties.
- **Analytics & Cookies (Pre-Launch)**: Before production deployment, a decision MUST be made between cookieless analytics (Plausible/Umami) requiring no banner, or Google Analytics 4 requiring a strict KVKK/GDPR cookie consent banner.
- **Indexing Constraints**: `/admin/*` and `/rapor/*` routes MUST contain `robots: { index: false }` to strictly prevent crawler indexing.

## 11. Naming Conventions & Documentation
- **Files & Folders**: 
  - `kebab-case` for folder names (`service-reports`)
  - `PascalCase.tsx` for React components (`LoginForm.tsx`)
  - `camelCase.ts` for utility/action files (`formatDate.ts`)
- **Variables**: `camelCase` for variables and functions.
- **Functions**: DO NOT use `function foo() {}`. ALL functions, components, and utilities MUST be declared as ES6 Arrow Functions (`const foo = () => {}`).
- **Exports**: ALL named exports MUST be inline (`export const foo = ...`). DO NOT group exports at the bottom of the file (`export { foo };`). *Exception:* Next.js required default exports (`export default`) for pages and layouts.
- **Constants**: `SCREAMING_SNAKE_CASE` for global constants (`DEFAULT_SETTINGS`, `ROUTES`).
- **Interfaces**: `PascalCase` with `Doc` suffix for Firestore models (`PestDoc`, `HeroSlideDoc`).
- **JSDoc Comments**: ALL utility functions, Server Actions, and complex components MUST include standard `/** JSDoc */` comments explaining parameters, return types, and purpose. Never leave complex logic undocumented.
- **Inline Styles**: DO NOT use inline `style={{}}` inside JSX tags. Always use Tailwind classes. If dynamic CSS variables or styles are absolutely required for runtime logic, extract the style object to a `const` above the `return` statement.

## 12. PAIN POINTS & STRICT PROHIBITIONS (Lessons Learned)
*These rules are written in blood based on previous AI failures. Violating them is a critical offense.*
- **NEVER Overwrite Files**: DO NOT use overwrite commands or tools to replace files like `routes.ts`, `dictionary.ts`, or `ui.ts`. ALWAYS use precise text replacement to append or modify.
- **NO Arbitrary Tailwind**: NEVER use arbitrary Tailwind brackets like `blur-[120px]`, `w-[50%]`, or `h-[2px]`. Use standard classes (`h-0.5`, `w-1/2`) or semantic variables.
- **NO Excessive Gradients/Blobs**: The design language is FLAT, MINIMAL, and PREMIUM. Stop adding massive background gradients, glow effects, or arbitrary blobs.
- **NO UI Hallucinations**: Do NOT invent features or placeholder texts (e.g., adding "Görsel Bekleniyor" because an image is missing). Stick EXACTLY to the requested design.
- **URL vs. Code Language Separation**: URLs (`href="/hizmetler"`) MUST remain in Turkish for SEO. However, everything the user does not see (IDs, variables, Firestore fields) MUST remain in English. DO NOT translate URLs to English.
- **Respect CSS Variables**: If a color looks wrong in dark mode, DO NOT swap the variables around. Fix the underlying CSS variable definition in `globals.css` instead of hardcoding a hack.
- **Dependency Awareness & Smart Merging**: Before modifying a component, BE AWARE of its dependencies and how it merges props. DO NOT use brute-force hacks like `!important` (e.g., `!px-2`) to override CSS. If a component uses naive string concatenation for `className`, upgrade it to use the `cn()` utility (`tailwind-merge` + `clsx`) for intelligent merging.

> **FINAL WARNING**: Do not attempt to bypass these rules for "quick fixes". Every PR, feature, and modification must strictly adhere to this manifesto.
