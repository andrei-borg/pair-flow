# Base Canvas — Design Spec

**Date:** 2026-05-25  
**Feature:** 11 — Base Canvas  
**Status:** Approved

## Goal

Replace the canvas placeholder in `WorkspaceShell` with a Liveblocks-backed React Flow canvas that serves as the collaborative foundation for the product. No custom node/edge rendering, no persistence logic, no AI behavior — just a working multiplayer canvas.

## Files

| File | Action |
|---|---|
| `types/canvas.ts` | New — shared node/edge type definitions |
| `components/editor/canvas-wrapper.tsx` | New — Liveblocks room setup (client component) |
| `components/editor/canvas.tsx` | New — React Flow canvas (client component) |
| `components/editor/workspace-shell.tsx` | Edit — pass `project.id` to `<CanvasWrapper>`, remove placeholder |

All required packages are already installed: `@liveblocks/react`, `@liveblocks/react-flow`, `@xyflow/react`.

## Architecture

```
WorkspaceShell (client)
  └─ CanvasWrapper (client) — receives roomId=project.id
       └─ LiveblocksProvider authEndpoint="/api/liveblocks-auth"
            └─ RoomProvider id=roomId, initialPresence={ cursor: null, isThinking: false }
                 └─ CanvasErrorBoundary (inline class; centered error message)
                      └─ ClientSideSuspense fallback="Loading…"
                           └─ Canvas (client)
                                └─ ReactFlow
                                     ├─ MiniMap
                                     └─ Background (dots)
```

## `types/canvas.ts`

Shared types — imported by canvas components and any future feature that touches canvas nodes or edges.

```ts
import type { Node, Edge } from '@xyflow/react'

export interface NodeData extends Record<string, unknown> {
  label: string
  color?: string
  shape?: string
}

export type CanvasNode = Node<NodeData, 'canvasNode'>
export type CanvasEdge = Edge<Record<string, unknown>, 'canvasEdge'>
```

`Record<string, unknown>` satisfies the React Flow constraint that node/edge data must be indexable.

## `canvas-wrapper.tsx`

Client component that receives `roomId` as a prop and sets up the full Liveblocks room hierarchy.

- `LiveblocksProvider` uses `authEndpoint="/api/liveblocks-auth"` (the existing POST route).
- `RoomProvider` uses `id={roomId}` and `initialPresence={{ cursor: null, isThinking: false }}` — both fields are required by `liveblocks.config.ts`.
- `CanvasErrorBoundary` is a minimal React class error boundary defined in the same file. No new npm dependency.
- `ClientSideSuspense` shows centered "Loading canvas…" text while the room connects.

## `canvas.tsx`

Client component that renders the collaborative React Flow canvas. Imported inside `ClientSideSuspense` so it can safely use suspense-mode Liveblocks hooks.

- `useLiveblocksFlow({ suspense: true, nodes: { initial: [] }, edges: { initial: [] } })` — starts empty; Liveblocks storage provides the source of truth once connected.
- `<ReactFlow>` receives synced `nodes`, `edges`, `onNodesChange`, `onEdgesChange`, `onConnect`, `onDelete`.
- `connectionMode="loose"` — allows connections from any handle.
- `fitView` — fits the empty canvas on mount.
- `<MiniMap />` — thumbnail overview.
- `<Background variant="dots" />` — dot-pattern background.
- No `<Controls />` — out of scope for this feature.

CSS imports in this file:
- `@xyflow/react/dist/style.css`
- `@liveblocks/react-ui/styles.css`
- `@liveblocks/react-flow/styles.css`

## `workspace-shell.tsx` change

Replace:
```tsx
<div className="flex flex-1 items-center justify-center bg-background">
  <p className="text-sm text-muted-foreground">Canvas coming soon</p>
</div>
```

With:
```tsx
<CanvasWrapper roomId={project.id} />
```

The wrapper fills the available space via `flex-1` on its parent container.

## Scope Limits

- No custom node or edge renderers.
- No persistence logic (canvas state lives only in Liveblocks storage).
- No AI behavior.
- No Controls component.

## Acceptance Criteria

- Client canvas wrapper sets up the Liveblocks room.
- React Flow uses Liveblocks-synced nodes and edges.
- Shared canvas types exist in `types/canvas.ts`.
- `npm run build` passes.
