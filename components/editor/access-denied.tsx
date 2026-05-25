import Link from 'next/link'
import { Lock } from 'lucide-react'

export function AccessDenied() {
  return (
    <div className="flex h-[calc(100dvh-3rem)] items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <h1 className="text-lg font-medium text-foreground">Access denied</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          This project doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <Link href="/editor" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to editor
        </Link>
      </div>
    </div>
  )
}
