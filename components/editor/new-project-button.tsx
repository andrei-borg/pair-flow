"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context";

export function NewProjectButton() {
  const { openCreate } = useProjectDialogsContext();

  return (
    <Button onClick={openCreate}>
      <Plus className="h-5 w-5" />
      New Project
    </Button>
  );
}
