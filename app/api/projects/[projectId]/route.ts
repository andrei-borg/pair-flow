import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
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

  const name =
    typeof body === 'object' && body !== null && 'name' in body && typeof (body as { name: unknown }).name === 'string'
      ? (body as { name: string }).name.trim()
      : ''
  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

  try {
    const existing = await prisma.project.findUnique({ where: { id: projectId } })
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })
    if (existing.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name },
    })
    return Response.json({ project })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  try {
    const existing = await prisma.project.findUnique({ where: { id: projectId } })
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })
    if (existing.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.project.delete({ where: { id: projectId } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
