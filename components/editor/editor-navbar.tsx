"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

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
      <div className="px-3">
        <UserButton />
      </div>
    </header>
  );
}
