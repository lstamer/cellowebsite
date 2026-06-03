---
name: lint cleanup
overview: Fix the current `npm run lint` failure by separating generated/local tooling noise from real app code issues, then resolving the app issues in independent workstreams that can be implemented in parallel.
todos:
  - id: scope-eslint
    content: Update ESLint ignores so local/generated `.claude` files and screenshot helper artifacts no longer block app lint.
    status: pending
  - id: escape-terms
    content: Escape all offending apostrophes and double quotes in `src/app/terms/page.tsx` JSX text nodes without changing rendered copy.
    status: pending
  - id: fix-navbar
    content: Move the mobile-open ref sync out of render in `Navbar` and remove the unused GSAP matchMedia callback parameter.
    status: pending
  - id: cleanup-small-src
    content: Remove unused `ScrollTrigger` imports and change the two initial `duration` declarations from `let` to `const`.
    status: pending
  - id: verify-lint-ui
    content: Run lint again and visually verify the affected routes and mobile navbar behavior after implementation.
    status: pending
isProject: false
---

# Lint Cleanup Plan

## Current Lint Result

`npm run lint` currently reports `68 problems`: `52 errors` and `16 warnings`.

The issues split into two broad groups:

- Generated/local tooling files: `15 errors`, `9 warnings`.
- Real app source files under `src`: `37 errors`, `7 warnings`.

## Workstream 1: Correct ESLint Scope

Files:

- [eslint.config.mjs](eslint.config.mjs)
- [snapshot.js](snapshot.js)
- [.claude/mcp-servers/mcp-unsplash/src/index.ts](.claude/mcp-servers/mcp-unsplash/src/index.ts)
- `.claude/worktrees/**` generated copies

Root cause:

ESLint is being run as plain `eslint`, and the flat config only restores a small subset of Next's default ignores:

```js
// eslint.config.mjs
// Override default ignores of eslint-config-next.
globalIgnores([
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
])
```

With ESLint flat config, dot directories are not automatically ignored in the way older configs often were. That means local agent/MCP files under `.claude/**`, generated worktree snapshots, and root screenshot helper scripts are being treated as app code.

Issues in this category:

- `.claude/mcp-servers/mcp-unsplash/src/index.ts`: `no-explicit-any` and unused `index` warnings from local MCP tooling.
- `.claude/mcp-servers/mcp-unsplash/build/index.js`: unused `index` warning from built output.
- `.claude/worktrees/.../snapshot.js`: CommonJS `require()` and unused catch parameter warnings repeated across generated worktrees.
- `.claude/worktrees/.../src/components/weddings/WeddingBenefits.tsx`: duplicated app-source lint errors inside isolated agent worktrees.
- `snapshot.js`: CommonJS `require()` and unused catch parameter in a root-level Puppeteer helper.

Permanent solution:

Update [eslint.config.mjs](eslint.config.mjs) so lint ignores local/generated surfaces explicitly:

- `.claude/**` for local MCP servers and agent worktrees.
- `snapshot.js` for the root screenshot helper currently failing lint.
- likely `tmp-ss*.mjs`, `test-screenshot.mjs`, and `ss.mjs` to match the visual-verification helper pattern already present in the repo.
- keep the existing Next ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.

Effect on codebase: negligible runtime effect. This only changes lint coverage so production/app code remains checked while local generated tooling stops blocking app lint.

Complexity: straightforward. The main judgment call is avoiding an overbroad ignore that would hide real source files; the ignore list should be precise and documented.

## Workstream 2: Escape Legal Page JSX Text

File:

- [src/app/terms/page.tsx](src/app/terms/page.tsx)

Root cause:

The legal page contains plain JSX text nodes with literal apostrophes and straight quotes. React's `react/no-unescaped-entities` rule flags those in JSX text, especially in prose like:

```tsx
By visiting, browsing, or otherwise using stamer.co.za (the
"Site"), you confirm that you have read, understood, and agree to
be bound by these Terms of Service ("Terms").
```

and:

```tsx
What This Site Is — and Isn't
```

Issues in this category:

- `34 errors` in [src/app/terms/page.tsx](src/app/terms/page.tsx).
- Affected sections include definitions of `"Site"`, `"Terms"`, `"we"`, `"you"`, the `Isn't` heading, possessives like `Luke's`, `Site's`, `party's`, `Stamer's`, quoted testimonial examples, `"as is"`, `"CPA"`, and `"Last revised"`.

Permanent solution:

Replace only the offending JSX text-node characters with valid JSX-safe entities:

- Use `&quot;` for straight double quotes in visible legal definitions and quoted phrases.
- Use `&apos;` for apostrophes inside JSX text nodes.
- Leave JavaScript strings, attributes, imports, and URLs untouched.
- Preserve legal copy exactly in rendered output.

Effect on codebase: negligible behavior effect. Rendered text remains the same; only JSX source becomes lint-compliant.

Complexity: straightforward but detail-heavy. The risk is accidentally editing legal wording, so the fix should be done carefully against the exact lint lines and rechecked with lint.

## Workstream 3: Fix Navbar Ref Access During Render

File:

- [src/components/Navbar.tsx](src/components/Navbar.tsx)

Root cause:

React 19's hooks lint rules flag this assignment inside `useMobileNavbarScrollHide` because it mutates a ref during render:

```tsx
const mobileOpenRef = useRef(mobileOpen);

mobileOpenRef.current = mobileOpen;
```

The ref is used by GSAP/scroll callbacks to read the latest mobile menu state without rebuilding the whole observer. That pattern is valid, but the update must happen outside render.

Issues in this category:

- `1 error`: `react-hooks/refs` on `mobileOpenRef.current = mobileOpen`.
- `1 warning`: unused `context` parameter in `mm.add(MOBILE_NAV_MM, (context) => { ... })`.

Permanent solution:

- Move `mobileOpenRef.current = mobileOpen` into an effect that depends on `mobileOpen`.
- Remove the unused `context` parameter from the `gsap.matchMedia().add` callback.
- Keep the existing scroll-hide behavior intact: scroll callbacks should still read `mobileOpenRef.current`, observers should still disable while the mobile menu is open, and cleanup should still revert GSAP state.

Effect on codebase: low. This touches mobile navbar behavior, but the behavioral intent remains unchanged; the fix aligns the implementation with React's render purity rules.

Complexity: moderate. The code is small, but it sits in a GSAP/scroll hook where timing matters, so it should be validated by lint and a quick visual/manual check of the mobile nav if we proceed to implementation.

## Workstream 4: Clean Up GSAP Import Warnings

Files:

- [src/components/Problem.tsx](src/components/Problem.tsx)
- [src/components/Services.tsx](src/components/Services.tsx)
- [src/components/Solution.tsx](src/components/Solution.tsx)
- [src/components/private-events/PrivateEventsLogistics.tsx](src/components/private-events/PrivateEventsLogistics.tsx)
- [src/components/ui/HandDrawnUnderline.tsx](src/components/ui/HandDrawnUnderline.tsx)
- [src/components/weddings/WeddingPricing.tsx](src/components/weddings/WeddingPricing.tsx)

Root cause:

These files import `ScrollTrigger` from [src/lib/gsap-client.ts](src/lib/gsap-client.ts), but only use `gsap` locally:

```tsx
import { gsap, ScrollTrigger } from "@/lib/gsap-client";
```

`src/lib/gsap-client.ts` already registers `ScrollTrigger` on the client when imported, so each component does not need to import the named `ScrollTrigger` value unless it calls `ScrollTrigger.create` or references the symbol directly.

Issues in this category:

- `6 warnings`: unused `ScrollTrigger` imports.

Permanent solution:

Change each import to import only `gsap` where `ScrollTrigger` is not referenced:

```tsx
import { gsap } from "@/lib/gsap-client";
```

Effect on codebase: negligible. No runtime behavior changes because importing `gsap` from the same module still executes the module-level plugin registration.

Complexity: straightforward.

## Workstream 5: Replace Two Reassignable Declarations With `const`

Files:

- [src/components/private-events/PrivateEventsValue.tsx](src/components/private-events/PrivateEventsValue.tsx)
- [src/components/weddings/WeddingValue.tsx](src/components/weddings/WeddingValue.tsx)

Root cause:

Both files compute an initial animation duration using `let`, but that variable is never reassigned:

```tsx
let duration = setHeight / SPEED_PX_PER_SEC;
```

Later resize logic correctly uses a separate `newDuration`, so the initial `duration` can be constant.

Issues in this category:

- `2 errors`: `prefer-const`, one in each file.
- ESLint reports these as auto-fixable.

Permanent solution:

Change only the initial `duration` declarations to `const`. Keep `setHeight` and `tween` as `let` because both are reassigned during resize handling.

Effect on codebase: negligible. This is a static-code-quality change with no behavior difference.

Complexity: straightforward.

## Parallel Execution Shape

These can be fixed concurrently with low conflict risk:

- Agent A: [eslint.config.mjs](eslint.config.mjs) lint scope ignores.
- Agent B: [src/app/terms/page.tsx](src/app/terms/page.tsx) JSX entity escaping.
- Agent C: [src/components/Navbar.tsx](src/components/Navbar.tsx) ref/effect and unused GSAP callback parameter.
- Agent D: GSAP import cleanup plus `prefer-const` fixes across the eight small component files.

The only coordination point is final verification after all changes are applied.

## Verification

After implementation:

- Run `npm run lint` and require `0 errors`.
- If UI files changed, inspect the relevant pages visually per repo rules. At minimum check `/`, `/services/weddings`, `/services/private-events`, `/terms`, and mobile navbar behavior, because the lint fixes touch those surfaces.
- Confirm [src/app/terms/page.tsx](src/app/terms/page.tsx) renders the same visible legal copy after entity escaping.