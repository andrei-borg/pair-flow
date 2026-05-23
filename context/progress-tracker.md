# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Feature 02 complete

## Current Goal

- Pick up the next feature spec from `context/feature-specs/`.

## Completed

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

## Session Notes

- Stack: Next.js 16, React 19, Tailwind v4 (`@tailwindcss/postcss`).
- `globals.css` token names (foreground/background/etc.) currently use the shadcn default palette. The richer dark palette described in `ui-context.md` (e.g., `--bg-base`, `--accent-primary`) is not yet mapped — to be addressed in a future spec.
