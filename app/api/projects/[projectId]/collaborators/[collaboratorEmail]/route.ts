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
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('Failed to delete collaborator:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
