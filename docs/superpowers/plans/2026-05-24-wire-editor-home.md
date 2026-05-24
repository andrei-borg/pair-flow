# Wire Editor Home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock project data in the editor sidebar and dialogs with real API calls, fetch projects server-side in the editor layout, and implement create/rename/delete mutations.

**Architecture:** The editor layout becomes an async server component that fetches owned and shared projects via `lib/projects.ts`, then passes both lists through `EditorLayoutClient` (a new "use client" wrapper) to the sidebar. A new `hooks/use-project-actions.ts` hook replaces `hooks/use-project-dialogs.ts`, adding API mutations and navigation. The create action generates a human-readable room ID (slug + short suffix) passed as the project's database ID, keeping project ID and Liveblocks room ID aligned.

**Tech Stack:** Next.js 16 app router (async server components, `useRouter`, `usePathname`, `router.refresh()`), React 19, Prisma (project queries), `@clerk/nextjs/server` (`auth`, `currentUser`), TypeScript strict mode.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `lib/projects.ts` | Server-side helper: fetch owned + shared projects |
| Create | `hooks/use-project-actions.ts` | Client hook: dialog state + create/rename/delete mutations |
| Create | `components/editor/editor-layout-client.tsx` | Client layout shell: sidebar toggle state, receives project lists as props |
| Create | `components/editor/new-project-button.tsx` | Client "New Project" button for the editor home page |
| Modify | `app/api/projects/route.ts` | Accept optional `id` field in POST body |
| Modify | `app/editor/layout.tsx` | Convert to async server component; fetch projects; render `EditorLayoutClient` |
| Modify | `app/editor/page.tsx` | Convert to server component; render `NewProjectButton` |
| Modify | `components/editor/project-dialogs-context.tsx` | Use `useProjectActions` instead of `useProjectDialogs` |
| Modify | `components/editor/project-dialogs.tsx` | Wire confirm buttons; show `roomIdPreview` |
| Modify | `components/editor/project-sidebar.tsx` | Accept real project data as props; remove mock data |
| Delete | `hooks/use-project-dialogs.ts` | Replaced by `hooks/use-project-actions.ts` |
| Modify | `context/progress-tracker.md` | Record completed work |

---

## Task 1: Create `lib/projects.ts`

**Files:**
- Create: `lib/projects.ts`

- [ ] **Step 1: Write the file**

```typescript
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export interface ProjectData {
  id: string
  name: string
}

export async function getProjectsForUser(): Promise<{
  myProjects: ProjectData[]
  sharedProjects: ProjectData[]
}> {
  const { userId } = await auth()
  if (!userId) return { myProjects: [], sharedProjects: [] }

  const user = await currentUser()
  const userEmail = user?.emailAddresses[0]?.emailAddress

  const [myProjects, sharedCollaborations] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true },
    }),
    userEmail
      ? prisma.projectCollaborator.findMany({
          where: { email: userEmail },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : [],
  ])

  const sharedProjects = (
    sharedCollaborations as Array<{ project: ProjectData }>
  ).map((c) => c.project)

  return { myProjects, sharedProjects }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors related to `lib/projects.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/projects.ts
git commit -m "feat: add getProjectsForUser server helper"
```

---

## Task 2: Update POST `/api/projects` to Accept Optional `id`

**Files:**
- Modify: `app/api/projects/route.ts`

- [ ] **Step 1: Update the POST handler to accept an optional `id` field**

Replace the existing `POST` function body with:

```typescript
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const name =
    typeof body === 'object' && body !== null && 'name' in body && typeof (body as { name: unknown }).name === 'string'
      ? ((body as { name: string }).name.trim() || 'Untitled Project')
      : 'Untitled Project'

  const id =
    typeof body === 'object' && body !== null && 'id' in body && typeof (body as { id: unknown }).id === 'string'
      ? ((body as { id: string }).id.trim() || undefined)
      : undefined

  try {
    const project = await prisma.project.create({
      data: { ownerId: userId, name, ...(id ? { id } : {}) },
    })
    return Response.json({ project }, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/projects/route.ts
git commit -m "feat: accept optional id in POST /api/projects"
```

---

## Task 3: Create `hooks/use-project-actions.ts`

This replaces `hooks/use-project-dialogs.ts`. It manages dialog state and performs API mutations.

**Files:**
- Create: `hooks/use-project-actions.ts`

- [ ] **Step 1: Write the file**

```typescript
"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"

function toSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  )
}

function randomSuffix(): string {
  return crypto.randomUUID().slice(0, 8)
}

export interface Project {
  id: string
  name: string
}

export type DialogType = "create" | "rename" | "delete" | null

export interface ProjectDialogsState {
  dialog: DialogType
  selectedProject: Project | null
  nameInput: string
  roomIdPreview: string
  loading: boolean
  openCreate: () => void
  openRename: (project: Project) => void
  openDelete: (project: Project) => void
  setNameInput: (value: string) => void
  confirmCreate: () => Promise<void>
  confirmRename: () => Promise<void>
  confirmDelete: () => Promise<void>
  close: () => void
}

export function useProjectActions(): ProjectDialogsState {
  const router = useRouter()
  const pathname = usePathname()
  const [dialog, setDialog] = useState<DialogType>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [nameInput, setNameInput] = useState("")
  const [suffix, setSuffix] = useState("")
  const [loading, setLoading] = useState(false)

  const roomIdPreview = nameInput.trim() ? `${toSlug(nameInput)}-${suffix}` : ""

  function close() {
    setDialog(null)
    setSelectedProject(null)
    setNameInput("")
    setSuffix("")
  }

  async function confirmCreate() {
    if (!nameInput.trim()) return
    const id = roomIdPreview
    setLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim(), id }),
      })
      if (!res.ok) return
      const data = (await res.json()) as { project: { id: string } }
      close()
      router.push(`/editor/${data.project.id}`)
    } finally {
      setLoading(false)
    }
  }

  async function confirmRename() {
    if (!selectedProject || !nameInput.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      if (!res.ok) return
      close()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function confirmDelete() {
    if (!selectedProject) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      })
      if (!res.ok) return
      const deletedId = selectedProject.id
      close()
      if (pathname?.includes(deletedId)) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    dialog,
    selectedProject,
    nameInput,
    roomIdPreview,
    loading,
    openCreate() {
      setNameInput("")
      setSuffix(randomSuffix())
      setDialog("create")
    },
    openRename(project) {
      setSelectedProject(project)
      setNameInput(project.name)
      setDialog("rename")
    },
    openDelete(project) {
      setSelectedProject(project)
      setDialog("delete")
    },
    setNameInput,
    confirmCreate,
    confirmRename,
    confirmDelete,
    close,
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors in the new file.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-project-actions.ts
git commit -m "feat: add useProjectActions hook with API mutations"
```

---

## Task 4: Update `project-dialogs-context.tsx`

**Files:**
- Modify: `components/editor/project-dialogs-context.tsx`

- [ ] **Step 1: Replace the file contents**

```typescript
"use client"

import { createContext, useContext } from "react"
import {
  useProjectActions,
  type ProjectDialogsState,
} from "@/hooks/use-project-actions"
import { ProjectDialogs } from "@/components/editor/project-dialogs"

const ProjectDialogsContext = createContext<ProjectDialogsState | null>(null)

export function useProjectDialogsContext(): ProjectDialogsState {
  const ctx = useContext(ProjectDialogsContext)
  if (!ctx)
    throw new Error(
      "useProjectDialogsContext must be used within ProjectDialogsProvider"
    )
  return ctx
}

export function ProjectDialogsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const state = useProjectActions()
  return (
    <ProjectDialogsContext.Provider value={state}>
      {children}
      <ProjectDialogs />
    </ProjectDialogsContext.Provider>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/editor/project-dialogs-context.tsx
git commit -m "refactor: wire context to useProjectActions"
```

---

## Task 5: Update `project-dialogs.tsx`

Wire confirm buttons and show `roomIdPreview` in the create dialog.

**Files:**
- Modify: `components/editor/project-dialogs.tsx`

- [ ] **Step 1: Replace the file contents**

```typescript
"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context"

export function ProjectDialogs() {
  const {
    dialog,
    selectedProject,
    nameInput,
    roomIdPreview,
    setNameInput,
    loading,
    close,
    confirmCreate,
    confirmRename,
    confirmDelete,
  } = useProjectDialogsContext()
  const renameInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {/* Create Project */}
      <Dialog
        open={dialog === "create"}
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Give your architecture workspace a name.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Input
              placeholder="Project name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nameInput.trim()) void confirmCreate()
              }}
              autoFocus
            />
            {roomIdPreview && (
              <p className="text-xs text-muted-foreground">
                Room ID: <span className="font-mono">{roomIdPreview}</span>
              </p>
            )}
          </div>
          <DialogFooter showCloseButton>
            <Button
              disabled={!nameInput.trim() || loading}
              onClick={() => void confirmCreate()}
            >
              {loading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Project */}
      <Dialog
        open={dialog === "rename"}
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Renaming &ldquo;{selectedProject?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <Input
            ref={renameInputRef}
            placeholder="Project name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameInput.trim()) void confirmRename()
            }}
            autoFocus
          />
          <DialogFooter showCloseButton>
            <Button
              disabled={!nameInput.trim() || loading}
              onClick={() => void confirmRename()}
            >
              {loading ? "Renaming…" : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project */}
      <Dialog
        open={dialog === "delete"}
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedProject?.name}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => void confirmDelete()}
            >
              {loading ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/editor/project-dialogs.tsx
git commit -m "feat: wire dialog confirm buttons to project mutations"
```

---

## Task 6: Update `project-sidebar.tsx`

Remove mock data; accept real `myProjects` and `sharedProjects` as props.

**Files:**
- Modify: `components/editor/project-sidebar.tsx`

- [ ] **Step 1: Replace the file contents**

```typescript
"use client"

import { X, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context"
import type { Project } from "@/hooks/use-project-actions"

function OwnedProjectItem({ project }: { project: Project }) {
  const { openRename, openDelete } = useProjectDialogsContext()

  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
      <span className="flex-1 truncate text-sm text-foreground">
        {project.name}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => openRename(project)}
          aria-label={`Rename ${project.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => openDelete(project)}
          aria-label={`Delete ${project.name}`}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function SharedProjectItem({ project }: { project: Project }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
      <span className="flex-1 truncate text-sm text-foreground">
        {project.name}
      </span>
    </div>
  )
}

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  myProjects: Project[]
  sharedProjects: Project[]
}

export function ProjectSidebar({
  isOpen,
  onClose,
  myProjects,
  sharedProjects,
}: ProjectSidebarProps) {
  const { openCreate } = useProjectDialogsContext()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-12 left-0 z-40 h-[calc(100dvh-3rem)] w-72 flex flex-col bg-card border-r border-border transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
          <span className="text-sm font-medium text-foreground">Projects</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden p-3 min-h-0">
          <Tabs
            defaultValue="my-projects"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="my-projects"
              className="flex-1 mt-2 overflow-y-auto"
            >
              {myProjects.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                  No projects yet
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {myProjects.map((project) => (
                    <OwnedProjectItem key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="shared" className="flex-1 mt-2 overflow-y-auto">
              {sharedProjects.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                  No shared projects
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {sharedProjects.map((project) => (
                    <SharedProjectItem key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-3 border-t border-border shrink-0">
          <Button className="w-full" variant="default" onClick={openCreate}>
            <Plus className="h-5 w-5 mr-2" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: error about `ProjectSidebar` props mismatch in `app/editor/layout.tsx` — this is expected and will be fixed in Task 7.

- [ ] **Step 3: Commit (after Task 7 fixes the type error)**

Hold off — commit together with the layout changes in Task 7.

---

## Task 7: Create `components/editor/editor-layout-client.tsx`

A new client component that holds sidebar open/close state and receives project data as props from the server layout.

**Files:**
- Create: `components/editor/editor-layout-client.tsx`

- [ ] **Step 1: Write the file**

```typescript
"use client"

import { useState } from "react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ProjectDialogsProvider } from "@/components/editor/project-dialogs-context"
import type { Project } from "@/hooks/use-project-actions"

interface EditorLayoutClientProps {
  children: React.ReactNode
  myProjects: Project[]
  sharedProjects: Project[]
}

export function EditorLayoutClient({
  children,
  myProjects,
  sharedProjects,
}: EditorLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProjectDialogsProvider>
      <div className="h-full">
        <EditorNavbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          myProjects={myProjects}
          sharedProjects={sharedProjects}
        />
        <main className="pt-12">{children}</main>
      </div>
    </ProjectDialogsProvider>
  )
}
```

- [ ] **Step 2: Update `app/editor/layout.tsx` to be an async server component**

Replace the entire file:

```typescript
import { getProjectsForUser } from "@/lib/projects"
import { EditorLayoutClient } from "@/components/editor/editor-layout-client"

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { myProjects, sharedProjects } = await getProjectsForUser()

  return (
    <EditorLayoutClient myProjects={myProjects} sharedProjects={sharedProjects}>
      {children}
    </EditorLayoutClient>
  )
}
```

- [ ] **Step 3: Delete `hooks/use-project-dialogs.ts`**

```bash
rm hooks/use-project-dialogs.ts
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/editor/editor-layout-client.tsx app/editor/layout.tsx
git rm hooks/use-project-dialogs.ts
git commit -m "feat: fetch projects server-side in editor layout"
```

---

## Task 8: Create `components/editor/new-project-button.tsx` and Update `app/editor/page.tsx`

Convert the page to a server component by extracting the interactive button into its own client component.

**Files:**
- Create: `components/editor/new-project-button.tsx`
- Modify: `app/editor/page.tsx`

- [ ] **Step 1: Create `new-project-button.tsx`**

```typescript
"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context"

export function NewProjectButton() {
  const { openCreate } = useProjectDialogsContext()

  return (
    <Button onClick={openCreate}>
      <Plus className="h-5 w-5" />
      New Project
    </Button>
  )
}
```

- [ ] **Step 2: Replace `app/editor/page.tsx`**

```typescript
import { NewProjectButton } from "@/components/editor/new-project-button"

export default function EditorPage() {
  return (
    <div className="flex h-[calc(100dvh-3rem)] items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-medium text-foreground">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-muted-foreground">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
        <NewProjectButton />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/editor/new-project-button.tsx app/editor/page.tsx
git commit -m "feat: convert editor home to server component"
```

---

## Task 9: Full Build and Progress Tracker Update

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 2: Update `context/progress-tracker.md`**

Add to the **Completed** section:

```
- Feature 07 — Wire Editor Home:
  - `lib/projects.ts` — `getProjectsForUser()` fetches owned projects (by ownerId) and shared projects (by collaborator email via `currentUser()`).
  - `hooks/use-project-actions.ts` — replaces `use-project-dialogs.ts`; manages dialog state + create/rename/delete mutations; create generates `slugify(name)-${randomSuffix()}` as the room/project ID; delete redirects to `/editor` if active project, else `router.refresh()`.
  - `app/api/projects/route.ts` — POST now accepts optional `id` field.
  - `components/editor/editor-layout-client.tsx` — client shell with sidebar toggle state; receives `myProjects`/`sharedProjects` as props.
  - `app/editor/layout.tsx` — converted to async server component; fetches projects via `getProjectsForUser()`; renders `EditorLayoutClient`.
  - `app/editor/page.tsx` — converted to server component; interactive "New Project" button extracted to `NewProjectButton` client component.
  - `components/editor/project-sidebar.tsx` — mock data removed; accepts real project lists as props.
  - `components/editor/project-dialogs.tsx` — confirm buttons wired to `confirmCreate/confirmRename/confirmDelete`; create dialog shows `roomIdPreview`.
  - `npm run build` passes.
```

Change **Current Phase** to `Feature 07 complete`.

- [ ] **Step 3: Commit**

```bash
git add context/progress-tracker.md
git commit -m "chore: mark feature 07 complete in progress tracker"
```

---

## Spec Coverage Check

| Spec requirement | Covered by |
|-----------------|-----------|
| Editor home is a server component | Task 8 — `app/editor/page.tsx` has no `"use client"` |
| Fetch owned + shared projects server-side | Task 1 (`lib/projects.ts`) + Task 7 (`layout.tsx`) |
| Pass both lists to sidebar | Task 7 (`EditorLayoutClient` → `ProjectSidebar` props) |
| No client-side fetching for initial load | Satisfied — data comes from server layout |
| `useProjectActions` hook in `hooks/` | Task 3 |
| Create: manage dialog state, name input | Task 3 — `openCreate`, `nameInput`, `setNameInput` |
| Create: generate short unique suffix | Task 3 — `randomSuffix()` = `crypto.randomUUID().slice(0,8)` |
| Create: slugify name to create room ID | Task 3 — `toSlug(nameInput) + '-' + suffix` |
| Create: call POST /api/projects | Task 3 — `confirmCreate()` |
| Create: navigate to new workspace | Task 3 — `router.push('/editor/${project.id}')` |
| Project ID and Liveblocks room ID aligned | Task 2+3 — generated `roomId` passed as `id` to API |
| Rename: store target id + current name | Task 3 — `openRename(project)` sets `selectedProject` + `nameInput` |
| Rename: call PATCH /api/projects/[id] | Task 3 — `confirmRename()` |
| Rename: refresh on success | Task 3 — `router.refresh()` |
| Delete: store target project | Task 3 — `openDelete(project)` sets `selectedProject` |
| Delete: call DELETE /api/projects/[id] | Task 3 — `confirmDelete()` |
| Delete: redirect if active, else refresh | Task 3 — `pathname?.includes(deletedId)` check |
| Create dialog shows room ID preview | Task 5 — `roomIdPreview` shown in dialog |
| Rename dialog pre-fills current name | Task 3+4 — `openRename` sets `nameInput` to `project.name` |
| Delete dialog shows project name | Task 5 — `selectedProject?.name` in description |
| `npm run build` passes | Task 9 |
