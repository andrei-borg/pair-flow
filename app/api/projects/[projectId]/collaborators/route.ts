import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getClerkIdentity, getProjectIfAccessible } from '@/lib/project-access'

interface CollaboratorData {
  email: string
  displayName: string
  avatarUrl: string | null
}

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
