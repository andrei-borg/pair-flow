"use client";

import { useState } from "react";
import { Share2, SidebarClose, SidebarOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/editor/share-dialog";
import { CanvasWrapper } from "@/components/editor/canvas-wrapper";

interface WorkspaceShellProps {
  project: { id: string; name: string; isOwner: boolean };
}

export function WorkspaceShell({ project }: WorkspaceShellProps) {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col">
      {/* Workspace navbar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <span className="text-sm font-medium text-foreground">{project.name}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAiSidebarOpen((prev) => !prev)}
            aria-label="Toggle AI sidebar"
          >
            {aiSidebarOpen ? (
              <SidebarClose className="h-5 w-5" />
            ) : (
              <SidebarOpen className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <CanvasWrapper roomId={project.id} />

        {/* AI sidebar placeholder */}
        {aiSidebarOpen && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
            <div className="flex h-12 items-center border-b border-border px-4">
              <span className="text-sm font-medium text-foreground">AI Chat</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">AI chat coming soon</p>
            </div>
          </aside>
        )}
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectId={project.id}
        isOwner={project.isOwner}
      />
    </div>
  );
}
