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
