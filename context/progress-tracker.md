# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Feature 12 complete

## Current Goal

- Pick up the next feature spec from `context/feature-specs/`.

## Completed

- Feature 12 — Shape Panel:
  - `types/canvas.ts` — added `NODE_SHAPES` const array, `NodeShape` union type, `NODE_COLORS` palette (8 color pairs), and `DEFAULT_NODE_COLOR` constant.
  - `components/editor/canvas-node.tsx` — custom React Flow node renderer (`CanvasNodeRenderer`); renders a bordered rectangle with centered label; exposes `Handle` on all four sides.
  - `components/editor/shape-panel.tsx` — floating pill toolbar with draggable icon buttons for all 6 shapes; encodes `ShapePayload` (shape, width, height) via `dataTransfer` using `application/x-canvas-shape` MIME type; sensible default sizes (rectangle wider than tall, circle square, diamond slightly larger).
  - `components/editor/canvas-wrapper.tsx` — wrapped `Canvas` in `ReactFlowProvider` so `useReactFlow()` is available inside `Canvas`.
  - `components/editor/canvas.tsx` — registered `canvasNode` node type; added `onDragOver`/`onDrop` handlers; drop reads payload, converts screen position to flow coordinates via `screenToFlowPosition`, and calls `reactFlow.addNodes()`; node ID uses shape + timestamp + counter; renders `<ShapePanel>` via React Flow `<Panel position="bottom-center">`.
  - `npm run build` passes.

- Feature 11 — Base Canvas:
  - `types/canvas.ts` — `NodeData` interface (`label`, `color?`, `shape?`); `CanvasNode` and `CanvasEdge` type aliases for React Flow's generic `Node`/`Edge` with `'canvasNode'`/`'canvasEdge'` type strings.
  - `components/editor/canvas-wrapper.tsx` — client component wrapping `LiveblocksProvider` (authEndpoint `/api/liveblocks-auth`) + `RoomProvider` (roomId, initialPresence `{ cursor: null, isThinking: false }`) + inline `CanvasErrorBoundary` class + `ClientSideSuspense` with loading fallback.
  - `components/editor/canvas.tsx` — client component using `useLiveblocksFlow({ suspense: true, nodes: { initial: [] }, edges: { initial: [] } })`; renders `<ReactFlow>` with `ConnectionMode.Loose`, `fitView`, `<MiniMap />`, `<Background variant="dots" />`; imports React Flow and Liveblocks CSS.
  - `components/editor/workspace-shell.tsx` — canvas placeholder replaced with `<CanvasWrapper roomId={project.id} />`.
  - `npm run build` passes.

- Feature 10 — Liveblocks Setup:
  - `@liveblocks/node` installed.
  - `liveblocks.config.ts` — `Presence` typed with `cursor: { x, y } | null` and `isThinking: boolean`; `UserMeta` typed with `id` and `info: { name, avatar, color }`.
  - `lib/liveblocks.ts` — lazy-cached `Liveblocks` node client (`getLiveblocks()`); `cursorColorForUser()` deterministically maps a user ID to one of 10 fixed hex colors via a simple hash.
  - `app/api/liveblocks-auth/route.ts` — `POST /api/liveblocks-auth`; requires Clerk auth (401); verifies project access via `getProjectIfAccessible` (403 on failure); calls `getOrCreateRoom` to ensure room exists; returns access-token session with `name`, `avatar`, and generated `color` attached as `userInfo`.
  - `npm run build` passes.

- Feature 09 — Share Dialog:
  - `lib/project-access.ts` — `getProjectIfAccessible()` now returns `isOwner: boolean`; owner returns `true`, collaborator returns `false`.
  - `app/api/projects/[projectId]/collaborators/route.ts` — GET (list collaborators enriched via Clerk `getUserList`, accessible to owner and collaborators) + POST (invite by email, owner-only, upsert with `projectId_email` key).
  - `app/api/projects/[projectId]/collaborators/[collaboratorEmail]/route.ts` — DELETE (remove collaborator, owner-only, 204).
  - `components/ui/avatar.tsx` — shadcn Avatar component added.
  - `components/editor/share-dialog.tsx` — client dialog; owner view: email invite input, collaborator list with remove buttons, copy-link with Copied! feedback; collaborator view: read-only list + copy-link; Clerk avatars and display names with email fallback.
  - `components/editor/workspace-shell.tsx` — Share button enabled; opens `ShareDialog`; `WorkspaceShellProps.project` extended with `isOwner: boolean`.
  - `npm run build` passes.

- Feature 08 — Editor Workspace Shell:
  - `lib/project-access.ts` — `getClerkIdentity()` returns `{ userId, email }` from Clerk; `getProjectIfAccessible()` checks owner or collaborator membership and returns project data or `null`.
  - `components/editor/access-denied.tsx` — centered lock-icon component with short message and link back to `/editor`; shown for missing or unauthorized projects.
  - `components/editor/project-sidebar.tsx` — updated `OwnedProjectItem` and `SharedProjectItem` to accept `isActive` prop; `ProjectSidebar` uses `usePathname()` to derive the active room ID and highlights the matching entry.
  - `components/editor/workspace-shell.tsx` — client shell with AI sidebar toggle state; workspace sub-navbar shows project name, disabled Share button, and AI sidebar toggle; canvas placeholder fills remaining space; AI sidebar placeholder slides in on the right.
  - `app/editor/[roomId]/page.tsx` — async server component; unauthenticated users are redirected to `/sign-in`; inaccessible/missing projects render `AccessDenied`; authorized users see `WorkspaceShell`.
  - `npm run build` passes.

- Feature 07 — Wire Editor Home:
  - `lib/projects.ts` — `getProjectsForUser()` fetches owned projects (by `ownerId`) and shared projects (by collaborator email via `currentUser()`).
  - `hooks/use-project-actions.ts` — replaces `use-project-dialogs.ts`; manages dialog state + create/rename/delete mutations; create generates `slugify(name)-${randomSuffix()}` as the room/project ID; delete redirects to `/editor` if active project, else `router.refresh()`.
  - `app/api/projects/route.ts` — POST now accepts optional `id` field so the generated room ID is stored as the project's database ID.
  - `components/editor/editor-layout-client.tsx` — new client shell with sidebar toggle state; receives `myProjects`/`sharedProjects` as props from the server layout.
  - `app/editor/layout.tsx` — converted to async server component; fetches projects via `getProjectsForUser()`; renders `EditorLayoutClient`.
  - `app/editor/page.tsx` — converted to server component; interactive "New Project" button extracted to `NewProjectButton` client component.
  - `components/editor/project-sidebar.tsx` — mock data removed; accepts real project lists as props.
  - `components/editor/project-dialogs.tsx` — confirm buttons wired to `confirmCreate/confirmRename/confirmDelete`; create dialog shows `roomIdPreview`.
  - `npm run build` passes.

- Feature 06 — Project APIs:
  - `app/api/projects/route.ts` — GET (list by ownerId, desc createdAt) + POST (create; defaults name to "Untitled Project").
  - `app/api/projects/[projectId]/route.ts` — PATCH (rename, owner-only) + DELETE (owner-only, 204).
  - Auth via `auth()` from `@clerk/nextjs/server`; 401 for unauthenticated, 403 for non-owner.
  - Error handling: try/catch on Prisma calls (500) and request.json() (400).
  - `npm run build` passes.

- Feature 05 — Prisma Setup:
  - `prisma/models/project.prisma` — `Project` (ownerId, name, description?, status enum DRAFT/ARCHIVED, canvasJsonPath?, timestamps, indexes on ownerId and createdAt) and `ProjectCollaborator` (projectId cascade-delete, email, createdAt, unique on projectId+email, indexes on email and projectId+createdAt).
  - `lib/prisma.ts` — cached singleton; branches on `DATABASE_URL`: `prisma+postgres://` uses `@prisma/adapter-ppg` (Prisma Postgres adapter), otherwise uses `@prisma/adapter-pg`; cached on `globalThis` in dev for hot-reload safety.
  - Migration `20260524191415_init_project_models` applied to Prisma Postgres.
  - Prisma Client (7.8.0) generated to `app/generated/prisma/`.
  - `.env` populated with `DATABASE_URL` so `prisma.config.ts` dotenv load finds it.
  - `npm run build` passes.

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
