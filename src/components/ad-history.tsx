"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";
import { deleteAdDesign } from "@/actions/ad-designs";
import type { AdDesignSummary } from "@/types/ad-design";
import { getFormatById } from "@/lib/ad-formats";
import ConfirmModal from "@/components/confirm-modal";

interface AdHistoryProps {
  designs: AdDesignSummary[];
  projectId: string;
  onLoad: (designId: string) => void;
}

export function AdHistory({ designs, projectId, onLoad }: AdHistoryProps) {
  const [isDeleting, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (designs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No saved designs yet. Generate your first ad above.
      </p>
    );
  }

  function handleDeleteRequest(id: string) {
    setDeletingId(id);
    setConfirmOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deletingId) return;
    startTransition(async () => {
      await deleteAdDesign(deletingId, projectId);
      setDeletingId(null);
      setConfirmOpen(false);
    });
  }

  return (
    <>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {designs.map((design) => {
        const format = getFormatById(design.format);
        return (
          <Card
            key={design.id}
            className="cursor-pointer hover:border-primary/50 transition-colors group"
          >
            <CardContent className="p-3">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onLoad(design.id)}
              >
                <div
                  className="w-full rounded-sm bg-muted/50 border border-muted-foreground/20 mb-2"
                  style={{ aspectRatio: `${design.width}/${design.height}` }}
                />
                <p className="text-xs font-medium truncate">
                  {format?.label ?? design.format}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {design.prompt.slice(0, 60)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(design.createdAt).toLocaleDateString()}
                </p>
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 w-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={() => handleDeleteRequest(design.id)}
                disabled={isDeleting}
              >
                <IconTrash className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
    <ConfirmModal
      isOpen={confirmOpen}
      onClose={() => { setConfirmOpen(false); setDeletingId(null); }}
      onConfirm={handleDeleteConfirm}
      title="Delete Design"
      message="Are you sure you want to delete this design? This action is irreversible."
      isLoading={isDeleting}
    />
    </>
  );
}
