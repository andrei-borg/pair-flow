import { currentUser } from '@clerk/nextjs/server'
import { getLiveblocks, cursorColorForUser } from '@/lib/liveblocks'
import { getClerkIdentity, getProjectIfAccessible } from '@/lib/project-access'

export async function POST(request: Request) {
  const identity = await getClerkIdentity()
  if (!identity) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { room } = await request.json()
  const project = await getProjectIfAccessible(room, identity)
  if (!project) {
    return new Response('Forbidden', { status: 403 })
  }

  const user = await currentUser()
  const name =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    identity.email ||
    identity.userId
  const avatar = user?.imageUrl ?? ''
  const color = cursorColorForUser(identity.userId)

  const liveblocks = getLiveblocks()
  await liveblocks.getOrCreateRoom(room, { defaultAccesses: [] })

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: { name, avatar, color },
  })
  session.allow(room, session.FULL_ACCESS)

  const { status, body } = await session.authorize()
  return new Response(body, { status })
}
