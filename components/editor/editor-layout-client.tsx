"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogsProvider } from "@/components/editor/project-dialogs-context";
import type { Project } from "@/hooks/use-project-actions";

interface EditorLayoutClientProps {
  children: React.ReactNode;
  myProjects: Project[];
  sharedProjects: Project[];
}

export function EditorLayoutClient({
  children,
  myProjects,
  sharedProjects,
}: EditorLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProjectDialogsProvider>
      <div className="h-full">
        <EditorNavbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          myProjects={myProjects}
          sharedProjects={sharedProjects}
        />
        <main className="pt-12">{children}</main>
      </div>
    </ProjectDialogsProvider>
  );
}
