"use client";

import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context";
import type { Project } from "@/hooks/use-project-actions";

function OwnedProjectItem({ project }: { project: Project }) {
  const { openRename, openDelete } = useProjectDialogsContext();

  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
      <span className="flex-1 truncate text-sm text-foreground">
        {project.name}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => openRename(project)}
          aria-label={`Rename ${project.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => openDelete(project)}
          aria-label={`Delete ${project.name}`}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SharedProjectItem({ project }: { project: Project }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
      <span className="flex-1 truncate text-sm text-foreground">
        {project.name}
      </span>
    </div>
  );
}

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  myProjects: Project[];
  sharedProjects: Project[];
}

export function ProjectSidebar({
  isOpen,
  onClose,
  myProjects,
  sharedProjects,
}: ProjectSidebarProps) {
  const { openCreate } = useProjectDialogsContext();

  return (
    <>
      {/* Mobile backdrop scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-12 left-0 z-40 h-[calc(100dvh-3rem)] w-72 flex flex-col bg-card border-r border-border transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
          <span className="text-sm font-medium text-foreground">Projects</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden p-3 min-h-0">
          <Tabs defaultValue="my-projects" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>
            <TabsContent value="my-projects" className="flex-1 mt-2 overflow-y-auto">
              {myProjects.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                  No projects yet
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {myProjects.map((project) => (
                    <OwnedProjectItem key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="shared" className="flex-1 mt-2 overflow-y-auto">
              {sharedProjects.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                  No shared projects
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {sharedProjects.map((project) => (
                    <SharedProjectItem key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-3 border-t border-border shrink-0">
          <Button className="w-full" variant="default" onClick={openCreate}>
            <Plus className="h-5 w-5 mr-2" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
