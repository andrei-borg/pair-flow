"use client";

import { createContext, useContext } from "react";
import {
  useProjectDialogs,
  type ProjectDialogsState,
} from "@/hooks/use-project-dialogs";
import { ProjectDialogs } from "@/components/editor/project-dialogs";

const ProjectDialogsContext = createContext<ProjectDialogsState | null>(null);

export function useProjectDialogsContext(): ProjectDialogsState {
  const ctx = useContext(ProjectDialogsContext);
  if (!ctx)
    throw new Error(
      "useProjectDialogsContext must be used within ProjectDialogsProvider"
    );
  return ctx;
}

export function ProjectDialogsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useProjectDialogs();
  return (
    <ProjectDialogsContext.Provider value={state}>
      {children}
      <ProjectDialogs />
    </ProjectDialogsContext.Provider>
  );
}
