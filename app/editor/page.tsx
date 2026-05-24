"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context";

export default function EditorPage() {
  const { openCreate } = useProjectDialogsContext();

  return (
    <div className="flex h-[calc(100dvh-3rem)] items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-medium text-foreground">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-muted-foreground">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-5 w-5" />
          New Project
        </Button>
      </div>
    </div>
  );
}
