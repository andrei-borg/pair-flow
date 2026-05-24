"use client";

import { useState } from "react";

export interface Project {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
}

export type DialogType = "create" | "rename" | "delete" | null;

export interface ProjectDialogsState {
  dialog: DialogType;
  selectedProject: Project | null;
  nameInput: string;
  loading: boolean;
  openCreate: () => void;
  openRename: (project: Project) => void;
  openDelete: (project: Project) => void;
  setNameInput: (value: string) => void;
  close: () => void;
}

export function useProjectDialogs(): ProjectDialogsState {
  const [dialog, setDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [loading] = useState(false);

  return {
    dialog,
    selectedProject,
    nameInput,
    loading,
    openCreate() {
      setNameInput("");
      setDialog("create");
    },
    openRename(project) {
      setSelectedProject(project);
      setNameInput(project.name);
      setDialog("rename");
    },
    openDelete(project) {
      setSelectedProject(project);
      setDialog("delete");
    },
    setNameInput,
    close() {
      setDialog(null);
      setSelectedProject(null);
    },
  };
}
