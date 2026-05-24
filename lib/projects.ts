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

  const myProjects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true },
  })

  const sharedProjects = userEmail
    ? (
        await prisma.projectCollaborator.findMany({
          where: { email: userEmail },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        })
      ).map((c) => c.project)
    : []

  return { myProjects, sharedProjects }
}
