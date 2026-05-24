"use client";

import { createContext, useContext } from "react";
import {
  useProjectActions,
  type ProjectDialogsState,
} from "@/hooks/use-project-actions";
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
  const state = useProjectActions();
  return (
    <ProjectDialogsContext.Provider value={state}>
      {children}
      <ProjectDialogs />
    </ProjectDialogsContext.Provider>
  );
}
