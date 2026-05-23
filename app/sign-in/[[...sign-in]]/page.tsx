import { SignIn } from "@clerk/nextjs";
import { Cpu, Share2, FileText } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col w-1/2 bg-auth-panel border-r border-border px-16 py-12">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white leading-none">PF</span>
          </div>
          <span className="text-base font-semibold text-foreground">Pair Flow</span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-foreground leading-tight mb-4">
            Design systems at the<br />speed of thought.
          </h1>
          <p className="text-muted-foreground mb-10 max-w-sm">
            Describe your architecture in plain English. AI maps it to a shared
            canvas your whole team can refine in real time.
          </p>

          <ul className="space-y-7">
            <li className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-lg bg-accent-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cpu className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">AI Architecture Generation</p>
                <p className="text-sm text-muted-foreground">Describe your system, AI maps it to nodes and edges on a live canvas.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-lg bg-accent-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <Share2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">Real-time Collaboration</p>
                <p className="text-sm text-muted-foreground">Live cursors, presence indicators, and shared node editing across your team.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-lg bg-accent-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">Instant Spec Generation</p>
                <p className="text-sm text-muted-foreground">Export a complete Markdown technical spec directly from the canvas graph.</p>
              </div>
            </li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 Pair Flow. All rights reserved.</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background">
        <SignIn />
      </div>
    </div>
  );
}
