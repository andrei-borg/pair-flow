"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

/**
 * Layout component that provides an editor navbar, a controllable project sidebar, and a main content area.
 *
 * The component manages sidebar visibility internally: the navbar toggles the sidebar open/closed and the sidebar's close handler forces it closed.
 *
 * @param children - Content to render inside the layout's main area
 * @returns A React element containing the editor navbar, project sidebar, and a main area that renders `children`
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-full">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="pt-12 h-full">{children}</main>
    </div>
  );
}
