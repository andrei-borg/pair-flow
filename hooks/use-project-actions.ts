"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"

function toSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  )
}

function randomSuffix(): string {
  return crypto.randomUUID().slice(0, 8)
}

export interface Project {
  id: string
  name: string
}

export type DialogType = "create" | "rename" | "delete" | null

export interface ProjectDialogsState {
  dialog: DialogType
  selectedProject: Project | null
  nameInput: string
  roomIdPreview: string
  loading: boolean
  openCreate: () => void
  openRename: (project: Project) => void
  openDelete: (project: Project) => void
  setNameInput: (value: string) => void
  confirmCreate: () => Promise<void>
  confirmRename: () => Promise<void>
  confirmDelete: () => Promise<void>
  close: () => void
}

export function useProjectActions(): ProjectDialogsState {
  const router = useRouter()
  const pathname = usePathname()
  const [dialog, setDialog] = useState<DialogType>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [nameInput, setNameInput] = useState("")
  const [suffix, setSuffix] = useState("")
  const [loading, setLoading] = useState(false)

  const roomIdPreview = nameInput.trim() ? `${toSlug(nameInput)}-${suffix}` : ""

  function close() {
    setDialog(null)
    setSelectedProject(null)
    setNameInput("")
    setSuffix("")
  }

  async function confirmCreate() {
    if (loading || !nameInput.trim()) return
    const id = roomIdPreview
    setLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim(), id }),
      })
      if (!res.ok) return
      const data = (await res.json()) as { project: { id: string } }
      close()
      router.push(`/editor/${data.project.id}`)
    } finally {
      setLoading(false)
    }
  }

  async function confirmRename() {
    if (loading || !selectedProject || !nameInput.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      if (!res.ok) return
      close()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function confirmDelete() {
    if (loading || !selectedProject) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      })
      if (!res.ok) return
      const deletedId = selectedProject.id
      close()
      const deletedPath = `/editor/${deletedId}`
      if (pathname === deletedPath || pathname?.startsWith(`${deletedPath}/`)) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    dialog,
    selectedProject,
    nameInput,
    roomIdPreview,
    loading,
    openCreate() {
      setNameInput("")
      setSuffix(randomSuffix())
      setDialog("create")
    },
    openRename(project) {
      setSelectedProject(project)
      setNameInput(project.name)
      setDialog("rename")
    },
    openDelete(project) {
      setSelectedProject(project)
      setDialog("delete")
    },
    setNameInput,
    confirmCreate,
    confirmRename,
    confirmDelete,
    close,
  }
}
