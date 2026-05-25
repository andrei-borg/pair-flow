# Share Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Share dialog to the workspace that lets project owners invite/remove collaborators by email and lets all participants copy the project link; collaborator list is enriched with Clerk display names and avatars.

**Architecture:** Three new API routes handle listing (GET with Clerk enrichment), inviting (POST, owner-only), and removing (DELETE, owner-only) collaborators. A new `ShareDialog` client component renders the owner vs. collaborator view. `WorkspaceShell` gains an `isOwner` prop (sourced from the extended `getProjectIfAccessible` return) and wires the Share button to the dialog.

**Tech Stack:** Next.js 15 App Router, Prisma (PostgreSQL), `@clerk/nextjs/server` (`clerkClient`, `auth`), shadcn/ui (Dialog, Input, Button, Avatar), Tailwind CSS custom property tokens, Lucide React icons.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `lib/project-access.ts` |
| Modify | `components/editor/workspace-shell.tsx` |
| Modify | `app/editor/[roomId]/page.tsx` |
| Create | `app/api/projects/[projectId]/collaborators/route.ts` |
| Create | `app/api/projects/[projectId]/collaborators/[collaboratorEmail]/route.ts` |
| Create | `components/editor/share-dialog.tsx` |
| Add (shadcn) | `components/ui/avatar.tsx` |

---

## Task 1: Extend `getProjectIfAccessible` to return `isOwner`

**Files:**
- Modify: `lib/project-access.ts`

- [ ] **Step 1: Update return type and logic**

Replace the `getProjectIfAccessible` function with:

```typescript
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export interface ClerkIdentity {
  userId: string
  email: string | null
}

export async function getClerkIdentity(): Promise<ClerkIdentity | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  const email =
    user?.emailAddresses.find((e) => e.id === user?.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    null

  return { userId, email }
}

export async function getProjectIfAccessible(
  projectId: string,
  identity: ClerkIdentity,
): Promise<{ id: string; name: string; isOwner: boolean } | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  })

  if (!project) return null

  if (project.ownerId === identity.userId) {
    return { id: project.id, name: project.name, isOwner: true }
  }

  if (identity.email) {
    const collaborator = await prisma.projectCollaborator.findFirst({
      where: { projectId, email: identity.email },
    })
    if (collaborator) return { id: project.id, name: project.name, isOwner: false }
  }

  return null
}
```

- [ ] **Step 2: Update `app/editor/[roomId]/page.tsx` to pass `isOwner`**

The page passes `project` directly to `WorkspaceShell`. Since `project` now includes `isOwner`, update the call:

```typescript
import { redirect } from 'next/navigation'
import { getClerkIdentity, getProjectIfAccessible } from '@/lib/project-access'
import { AccessDenied } from '@/components/editor/access-denied'
import { WorkspaceShell } from '@/components/editor/workspace-shell'

interface PageProps {
  params: Promise<{ roomId: string }>
}

export default async function WorkspacePage({ params }: PageProps) {
  const { roomId } = await params

  const identity = await getClerkIdentity()
  if (!identity) redirect('/sign-in')

  const project = await getProjectIfAccessible(roomId, identity)
  if (!project) return <AccessDenied />

  return <WorkspaceShell project={project} />
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/andreiborg/pair-flow && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `project-access.ts` or `[roomId]/page.tsx`.

- [ ] **Step 4: Commit**

```bash
cd /Users/andreiborg/pair-flow && git add lib/project-access.ts app/editor/[roomId]/page.tsx
git commit -m "feat: extend getProjectIfAccessible to return isOwner"
```

---

## Task 2: Add shadcn Avatar component

**Files:**
- Create: `components/ui/avatar.tsx` (via shadcn CLI)

- [ ] **Step 1: Add avatar component**

```bash
cd /Users/andreiborg/pair-flow && npx shadcn@latest add avatar --yes 2>&1
```

Expected: `components/ui/avatar.tsx` created.

- [ ] **Step 2: Verify file exists**

```bash
ls /Users/andreiborg/pair-flow/components/ui/avatar.tsx
```

- [ ] **Step 3: Commit**

```bash
cd /Users/andreiborg/pair-flow && git add components/ui/avatar.tsx
git commit -m "feat: add shadcn Avatar component"
```

---

## Task 3: Add collaborators GET + POST API route

**Files:**
- Create: `app/api/projects/[projectId]/collaborators/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// app/api/projects/[projectId]/collaborators/route.ts
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getClerkIdentity, getProjectIfAccessible } from '@/lib/project-access'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getClerkIdentity()
  if (!identity) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  const project = await getProjectIfAccessible(projectId, identity)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const records = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    select: { email: true },
  })

  const emails = records.map((r) => r.email)

  interface CollaboratorData {
    email: string
    displayName: string
    avatarUrl: string | null
  }

  const collaborators: CollaboratorData[] = []

  if (emails.length > 0) {
    const client = await clerkClient()
    const clerkResponse = await client.users.getUserList({ emailAddress: emails })
    const clerkUsers = clerkResponse.data

    const emailToUser = new Map<string, (typeof clerkUsers)[number]>()
    for (const u of clerkUsers) {
      for (const e of u.emailAddresses) {
        emailToUser.set(e.emailAddress, u)
      }
    }

    for (const record of records) {
      const u = emailToUser.get(record.email)
      const parts = [u?.firstName, u?.lastName].filter(Boolean)
      collaborators.push({
        email: record.email,
        displayName: parts.length > 0 ? parts.join(' ') : record.email,
        avatarUrl: u?.imageUrl ?? null,
      })
    }
  }

  return Response.json({ collaborators })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const rawEmail =
    typeof body === 'object' &&
    body !== null &&
    'email' in body &&
    typeof (body as { email: unknown }).email === 'string'
      ? (body as { email: string }).email.trim().toLowerCase()
      : ''

  if (!rawEmail || !rawEmail.includes('@')) {
    return Response.json({ error: 'Valid email is required' }, { status: 400 })
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
    if (project.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const collaborator = await prisma.projectCollaborator.upsert({
      where: { projectId_email: { projectId, email: rawEmail } },
      create: { projectId, email: rawEmail },
      update: {},
    })
    return Response.json({ collaborator }, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/andreiborg/pair-flow && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/andreiborg/pair-flow && git add app/api/projects/[projectId]/collaborators/route.ts
git commit -m "feat: add collaborators GET and POST API"
```

---

## Task 4: Add collaborator DELETE route

**Files:**
- Create: `app/api/projects/[projectId]/collaborators/[collaboratorEmail]/route.ts`

- [ ] **Step 1: Create the DELETE route file**

```typescript
// app/api/projects/[projectId]/collaborators/[collaboratorEmail]/route.ts
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; collaboratorEmail: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, collaboratorEmail } = await params
  const email = decodeURIComponent(collaboratorEmail).toLowerCase()

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
    if (project.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.projectCollaborator.delete({
      where: { projectId_email: { projectId, email } },
    })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/andreiborg/pair-flow && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/andreiborg/pair-flow && git add "app/api/projects/[projectId]/collaborators/[collaboratorEmail]/route.ts"
git commit -m "feat: add collaborator DELETE API"
```

---

## Task 5: Build ShareDialog component

**Files:**
- Create: `components/editor/share-dialog.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/editor/share-dialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Copy, Check, UserX, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Collaborator {
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  isOwner,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCollaborators() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      const data = await res.json();
      setCollaborators(data.collaborators ?? []);
    } catch {
      // silent — empty list shown
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadCollaborators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError((data as { error?: string }).error ?? "Failed to invite");
        return;
      }
      setInviteEmail("");
      await loadCollaborators();
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(email: string) {
    try {
      await fetch(
        `/api/projects/${projectId}/collaborators/${encodeURIComponent(email)}`,
        { method: "DELETE" },
      );
      setCollaborators((prev) => prev.filter((c) => c.email !== email));
    } catch {
      // silent
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Share</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isOwner && (
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInvite();
                }}
                className="flex-1"
              />
              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Invite
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Collaborators
            </p>

            {loading ? (
              <p className="py-2 text-sm text-muted-foreground">Loading…</p>
            ) : collaborators.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No collaborators yet.
              </p>
            ) : (
              collaborators.map((c) => (
                <div key={c.email} className="flex items-center gap-3 py-1.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    {c.avatarUrl && (
                      <AvatarImage src={c.avatarUrl} alt={c.displayName} />
                    )}
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {initials(c.displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {c.displayName}
                    </p>
                    {c.displayName !== c.email && (
                      <p className="truncate text-xs text-muted-foreground">
                        {c.email}
                      </p>
                    )}
                  </div>

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(c.email)}
                      aria-label={`Remove ${c.displayName}`}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleCopy}
            className="w-full gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy link
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/andreiborg/pair-flow && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/andreiborg/pair-flow && git add components/editor/share-dialog.tsx
git commit -m "feat: add ShareDialog component"
```

---

## Task 6: Wire Share button in WorkspaceShell

**Files:**
- Modify: `components/editor/workspace-shell.tsx`

- [ ] **Step 1: Update WorkspaceShell**

Replace the entire file with:

```typescript
// components/editor/workspace-shell.tsx
"use client";

import { useState } from "react";
import { Share2, SidebarClose, SidebarOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/editor/share-dialog";

interface WorkspaceShellProps {
  project: { id: string; name: string; isOwner: boolean };
}

export function WorkspaceShell({ project }: WorkspaceShellProps) {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col">
      {/* Workspace navbar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <span className="text-sm font-medium text-foreground">{project.name}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAiSidebarOpen((prev) => !prev)}
            aria-label="Toggle AI sidebar"
          >
            {aiSidebarOpen ? (
              <SidebarClose className="h-5 w-5" />
            ) : (
              <SidebarOpen className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas placeholder */}
        <div className="flex flex-1 items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Canvas coming soon</p>
        </div>

        {/* AI sidebar placeholder */}
        {aiSidebarOpen && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
            <div className="flex h-12 items-center border-b border-border px-4">
              <span className="text-sm font-medium text-foreground">AI Chat</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">AI chat coming soon</p>
            </div>
          </aside>
        )}
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectId={project.id}
        isOwner={project.isOwner}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/andreiborg/pair-flow && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/andreiborg/pair-flow && git add components/editor/workspace-shell.tsx
git commit -m "feat: wire Share button to ShareDialog in WorkspaceShell"
```

---

## Task 7: Final build verification

- [ ] **Step 1: Run full build**

```bash
cd /Users/andreiborg/pair-flow && npm run build 2>&1
```

Expected: build completes with no errors. Warnings about unused vars or missing `key` props should be fixed before marking done.

- [ ] **Step 2: Fix any build errors, then commit**

If any TypeScript or build errors appear, fix them in the relevant file and re-run `npm run build`. Once clean:

```bash
cd /Users/andreiborg/pair-flow && git add -p && git commit -m "fix: resolve build errors in share dialog feature"
```

- [ ] **Step 3: Update progress-tracker.md**

Add Feature 09 to the Completed section of `context/progress-tracker.md`:

```markdown
- Feature 09 — Share Dialog:
  - `lib/project-access.ts` — `getProjectIfAccessible()` now returns `isOwner: boolean`.
  - `app/api/projects/[projectId]/collaborators/route.ts` — GET (list collaborators, enriched via Clerk `getUserList`; accessible to owner and collaborators) + POST (invite by email, owner-only, upsert).
  - `app/api/projects/[projectId]/collaborators/[collaboratorEmail]/route.ts` — DELETE (remove collaborator, owner-only, 204).
  - `components/editor/share-dialog.tsx` — client dialog; owner view: email invite input, collaborator list with remove buttons, copy-link with Copied! feedback; collaborator view: read-only list + copy-link.
  - `components/editor/workspace-shell.tsx` — Share button now active; opens `ShareDialog`; `WorkspaceShellProps.project` extended with `isOwner`.
  - `npm run build` passes.
```

---

## Spec Coverage Check

| Requirement | Task |
|---|---|
| Share button opens dialog from workspace | Task 6 |
| Owners can invite collaborators by email | Task 3 (POST), Task 5 (UI) |
| Owners can view current collaborators | Task 3 (GET), Task 5 (UI) |
| Owners can remove collaborators | Task 4 (DELETE), Task 5 (UI) |
| Copy project link with Copied! feedback | Task 5 |
| Collaborators see read-only access | Task 5 (`isOwner` prop gates invite/remove) |
| Collaborator names/avatars from Clerk | Task 3 (Clerk `getUserList` enrichment) |
| Fall back to email if no Clerk user found | Task 3 (`displayName` falls back to `email`) |
| No local user table added | All tasks — Prisma only, no new model |
| `npm run build` passes | Task 7 |
