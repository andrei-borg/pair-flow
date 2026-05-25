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
