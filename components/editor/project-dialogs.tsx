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

export function ProjectDialogs() {
  const {
    dialog,
    selectedProject,
    nameInput,
    roomIdPreview,
    setNameInput,
    loading,
    close,
    confirmCreate,
    confirmRename,
    confirmDelete,
  } = useProjectDialogsContext();
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && nameInput.trim()) void confirmCreate();
              }}
              autoFocus
            />
            {roomIdPreview && (
              <p className="text-xs text-muted-foreground">
                Room ID:{" "}
                <span className="font-mono">{roomIdPreview}</span>
              </p>
            )}
          </div>
          <DialogFooter showCloseButton>
            <Button
              disabled={!nameInput.trim() || loading}
              onClick={() => void confirmCreate()}
            >
              {loading ? "Creating…" : "Create"}
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
              if (e.key === "Enter" && nameInput.trim()) void confirmRename();
            }}
            autoFocus
          />
          <DialogFooter showCloseButton>
            <Button
              disabled={!nameInput.trim() || loading}
              onClick={() => void confirmRename()}
            >
              {loading ? "Renaming…" : "Rename"}
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
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => void confirmDelete()}
            >
              {loading ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
