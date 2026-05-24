# Project API Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create four REST route handlers (list, create, rename, delete) for the `Project` model, authenticated via Clerk, with owner-only enforcement on mutations.

**Architecture:** Two Next.js App Router route files under `app/api/projects/`. Authentication is resolved via `auth()` from `@clerk/nextjs/server`, which returns `{ userId }` — `null` when signed out. All owner checks are done at the handler level before any Prisma mutation.

**Tech Stack:** Next.js 16 App Router route handlers, Clerk (`@clerk/nextjs/server`), Prisma (`lib/prisma.ts`), TypeScript strict mode.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/api/projects/route.ts` | Create | `GET` (list) + `POST` (create) |
| `app/api/projects/[projectId]/route.ts` | Create | `PATCH` (rename) + `DELETE` (delete) |

---

## Task 1: GET and POST `/api/projects`

**Files:**
- Create: `app/api/projects/route.ts`

- [ ] **Step 1: Create the file with the GET handler**

Create `app/api/projects/route.ts`:

```ts
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ projects })
}
```

- [ ] **Step 2: Add the POST handler to the same file**

Append to `app/api/projects/route.ts`:

```ts
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await request.json()
  const name =
    typeof body === 'object' && body !== null && 'name' in body && typeof (body as { name: unknown }).name === 'string'
      ? ((body as { name: string }).name.trim() || 'Untitled Project')
      : 'Untitled Project'

  const project = await prisma.project.create({
    data: { ownerId: userId, name },
  })

  return Response.json({ project }, { status: 201 })
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/andreiborg/pair-flow && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/projects/route.ts
git commit -m "feat: add GET and POST /api/projects route handlers"
```

---

## Task 2: PATCH and DELETE `/api/projects/[projectId]`

**Files:**
- Create: `app/api/projects/[projectId]/route.ts`

- [ ] **Step 1: Create the file with the PATCH handler**

Create `app/api/projects/[projectId]/route.ts`:

```ts
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  const existing = await prisma.project.findUnique({ where: { id: projectId } })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })
  if (existing.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body: unknown = await request.json()
  const name =
    typeof body === 'object' && body !== null && 'name' in body && typeof (body as { name: unknown }).name === 'string'
      ? (body as { name: string }).name.trim()
      : ''
  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name },
  })

  return Response.json({ project })
}
```

- [ ] **Step 2: Add the DELETE handler to the same file**

Append to `app/api/projects/[projectId]/route.ts`:

```ts
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  const existing = await prisma.project.findUnique({ where: { id: projectId } })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })
  if (existing.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.project.delete({ where: { id: projectId } })

  return new Response(null, { status: 204 })
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/andreiborg/pair-flow && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/projects/[projectId]/route.ts
git commit -m "feat: add PATCH and DELETE /api/projects/[projectId] route handlers"
```

---

## Task 3: Final verification

- [ ] **Step 1: Run ESLint**

```bash
cd /Users/andreiborg/pair-flow && npx eslint
```

Expected: no errors or warnings.

- [ ] **Step 2: Run build**

```bash
cd /Users/andreiborg/pair-flow && npm run build
```

Expected: build completes with no errors.

- [ ] **Step 3: Update progress tracker**

Edit `context/progress-tracker.md`:
- Move Feature 06 from "In Progress" to "Completed"
- Set "Current Phase" to `Feature 06 complete`
- Add entry under Completed:
  ```
  - Feature 06 — Project APIs:
    - `app/api/projects/route.ts` — GET (list by ownerId, desc createdAt) + POST (create; defaults name to "Untitled Project").
    - `app/api/projects/[projectId]/route.ts` — PATCH (rename, owner-only) + DELETE (owner-only, 204).
    - Auth via `auth()` from `@clerk/nextjs/server`; 401 for unauthenticated, 403 for non-owner.
    - `npm run build` passes.
  ```

- [ ] **Step 4: Commit progress tracker**

```bash
git add context/progress-tracker.md
git commit -m "chore: mark feature 06 complete in progress tracker"
```
