"use client";

import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
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
          <TabsContent value="my-projects" className="flex-1 mt-2">
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              No projects yet
            </div>
          </TabsContent>
          <TabsContent value="shared" className="flex-1 mt-2">
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              No shared projects
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-3 border-t border-border shrink-0">
        <Button className="w-full" variant="default">
          <Plus className="h-5 w-5 mr-2" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
