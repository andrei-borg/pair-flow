import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json({ projects })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
