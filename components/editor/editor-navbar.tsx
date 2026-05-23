"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * Top fixed editor navigation bar with a left-side toggle control.
 *
 * Renders a header fixed to the top of the viewport that displays a button which toggles the sidebar icon based on `sidebarOpen`.
 *
 * @param sidebarOpen - When `true`, shows the closed-panel icon; when `false`, shows the open-panel icon.
 * @param onToggleSidebar - Callback invoked when the toggle button is clicked.
 * @returns The header element for the editor navbar
 */
export function EditorNavbar({ sidebarOpen, onToggleSidebar }: EditorNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center bg-background border-b border-border">
      <div className="flex items-center px-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="flex-1" />
      <div className="px-3" />
    </header>
  );
}
