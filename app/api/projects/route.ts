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
