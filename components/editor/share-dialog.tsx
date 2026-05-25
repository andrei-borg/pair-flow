"use client";

import { useEffect, useState } from "react";
import { Copy, Check, UserX, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Collaborator {
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  isOwner,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCollaborators() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      const data = await res.json();
      setCollaborators((data as { collaborators?: Collaborator[] }).collaborators ?? []);
    } catch {
      // silent — empty list shown
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadCollaborators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError((data as { error?: string }).error ?? "Failed to invite");
        return;
      }
      setInviteEmail("");
      await loadCollaborators();
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(email: string) {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators/${encodeURIComponent(email)}`,
        { method: "DELETE" },
      );
      if (!res.ok) return; // Keep in list if delete failed
      setCollaborators((prev) => prev.filter((c) => c.email !== email));
    } catch {
      // silent - keep collaborator in list on network error
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Share</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isOwner && (
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInvite();
                }}
                className="flex-1"
              />
              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Invite
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Collaborators
            </p>

            {loading ? (
              <p className="py-2 text-sm text-muted-foreground">Loading…</p>
            ) : collaborators.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No collaborators yet.
              </p>
            ) : (
              collaborators.map((c) => (
                <div key={c.email} className="flex items-center gap-3 py-1.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    {c.avatarUrl && (
                      <AvatarImage src={c.avatarUrl} alt={c.displayName} />
                    )}
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {initials(c.displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {c.displayName}
                    </p>
                    {c.displayName !== c.email && (
                      <p className="truncate text-xs text-muted-foreground">
                        {c.email}
                      </p>
                    )}
                  </div>

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(c.email)}
                      aria-label={`Remove ${c.displayName}`}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleCopy}
            className="w-full gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy link
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
