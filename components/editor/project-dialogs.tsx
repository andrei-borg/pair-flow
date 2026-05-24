"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context";

function toSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled";
}

export function ProjectDialogs() {
  const { dialog, selectedProject, nameInput, setNameInput, loading, close } =
    useProjectDialogsContext();
  const renameInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Create Project */}
      <Dialog
        open={dialog === "create"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Give your architecture workspace a name.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Input
              placeholder="Project name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
            />
            {nameInput && (
              <p className="text-xs text-muted-foreground">
                Slug:{" "}
                <span className="font-mono">{toSlug(nameInput)}</span>
              </p>
            )}
          </div>
          <DialogFooter showCloseButton>
            <Button disabled={!nameInput.trim() || loading} onClick={close}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Project */}
      <Dialog
        open={dialog === "rename"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Renaming &ldquo;{selectedProject?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <Input
            ref={renameInputRef}
            placeholder="Project name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameInput.trim()) close();
            }}
            autoFocus
          />
          <DialogFooter showCloseButton>
            <Button disabled={!nameInput.trim() || loading} onClick={close}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project */}
      <Dialog
        open={dialog === "delete"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedProject?.name}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button variant="destructive" disabled={loading} onClick={close}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
