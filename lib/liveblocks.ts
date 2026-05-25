import { Liveblocks } from '@liveblocks/node'

declare global {
  // eslint-disable-next-line no-var
  var __liveblocks: Liveblocks | undefined
}

export function getLiveblocks(): Liveblocks {
  if (!globalThis.__liveblocks) {
    globalThis.__liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY!,
    })
  }
  return globalThis.__liveblocks
}

const CURSOR_COLORS = [
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#7986CB',
  '#4FC3F7',
  '#4DB6AC',
  '#81C784',
  '#FFD54F',
  '#FF8A65',
  '#A1887F',
]

export function cursorColorForUser(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length]
}
