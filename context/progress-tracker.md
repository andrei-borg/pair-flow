# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Feature 04 complete

## Current Goal

- Pick up the next feature spec from `context/feature-specs/`.

## Completed

- Feature 04 — Project Dialogs:
  - `hooks/use-project-dialogs.ts` — dialog/form/loading state hook; `DialogType`, `Project`, `ProjectDialogsState` types.
  - `components/editor/project-dialogs-context.tsx` — `ProjectDialogsProvider` + `useProjectDialogsContext`; renders `<ProjectDialogs />` at provider level so dialogs are always mounted.
  - `components/editor/project-dialogs.tsx` — Create (name input + live slug preview), Rename (prefilled, auto-focus, Enter submits), Delete (destructive confirm, no input) dialogs; all controlled via context.
  - `components/editor/project-sidebar.tsx` — mock project data (2 owned, 1 shared); owned items show hover rename/delete actions; shared items show no actions; mobile backdrop scrim (z-30, `sm:hidden`) closes sidebar on tap.
  - `app/editor/layout.tsx` — wrapped with `ProjectDialogsProvider`.
  - `app/editor/page.tsx` — editor home: centered heading, description, New Project button → Create dialog.
  - `tsc --noEmit` and `eslint` pass.

- Feature 03 — Auth (Clerk):
  - `@clerk/ui` installed; `dark` theme imported from `@clerk/ui/themes`.
  - `proxy.ts` at project root — protected-first middleware; public routes read from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` env vars.
  - `.env.local` extended with sign-in/sign-up URLs and fallback redirect URLs (`/editor`).
  - `app/layout.tsx` — `ClerkProvider` wraps the root layout with `dark` theme and CSS variable overrides (no hardcoded colors).
  - `app/page.tsx` — server redirect: authenticated → `/editor`, unauthenticated → `/sign-in`.
  - `app/sign-in/[[...sign-in]]/page.tsx` — two-panel layout (logo/tagline/feature list left, `<SignIn />` right); form-only on small screens.
  - `app/sign-up/[[...sign-up]]/page.tsx` — same two-panel layout with `<SignUp />`.
  - `components/editor/editor-navbar.tsx` — `<UserButton />` added to right section.
  - `npm run build` passes.

- Feature 02 — Editor chrome:
  - `components/editor/editor-navbar.tsx` — fixed-height top navbar (h-12, z-50), left sidebar toggle with `PanelLeftOpen`/`PanelLeftClose` icons, right section empty placeholder.
  - `components/editor/project-sidebar.tsx` — fixed overlay sidebar (z-40, w-72), slides in/out via `translate-x` transition, `isOpen`/`onClose` props, "Projects" header with close button, shadcn `Tabs` (My Projects / Shared) with empty placeholder states, full-width "New Project" button with `Plus` icon.
  - Dialog pattern: the existing `components/ui/dialog.tsx` (shadcn) is ready for future use — it already supports title/description/footer actions via the dark-theme tokens in `globals.css`. No additional dialogs built.
  - `tsc --noEmit` passes. No lint errors.

- Feature 01 — Design system:
  - `shadcn/ui` initialized (`components.json`, base-nova preset, `baseColor: neutral`, CSS variables).
  - Added components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea (`components/ui/*`).
  - `lucide-react` installed.
  - `lib/utils.ts` provides the `cn()` helper (clsx + tailwind-merge).
  - `app/globals.css` populated with shadcn CSS variables and a `.dark` block.
  - `app/layout.tsx` sets `className="dark"` on `<html>` so the dark theme is the default — no light styling appears.
  - `tsc --noEmit` passes.

## In Progress

- None.

## Next Up

- Awaiting the next feature spec from `context/feature-specs/`.

## Open Questions

- None.

## Architecture Decisions

- shadcn/ui is the only component primitive layer. Generated files in `components/ui/*` are not modified after install.
- Dark mode is enforced globally by placing the `dark` class on the root `<html>` element rather than relying on a runtime theme toggle (`ui-context.md` specifies dark-only).
- shadcn preset is `base-nova` (Base UI under the hood) — primitives come from `@base-ui/react`.
- Clerk middleware uses `proxy.ts` (Next.js 16 convention, not `middleware.ts`). Protected-first: all routes blocked unless matched by the public route list.
- Clerk appearance uses `@clerk/ui/themes` dark theme as base; variables reference existing CSS custom properties — no hardcoded colors.
- Clerk Accounts URL env vars (`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`) drive both the middleware public-route matcher and Clerk's internal redirects.

## Session Notes

- Stack: Next.js 16, React 19, Tailwind v4 (`@tailwindcss/postcss`).
- `globals.css` token names (foreground/background/etc.) currently use the shadcn default palette. The richer dark palette described in `ui-context.md` (e.g., `--bg-base`, `--accent-primary`) is not yet mapped — to be addressed in a future spec.
