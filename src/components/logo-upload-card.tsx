"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconUpload,
  IconTrash,
  IconLoader2,
  IconPhoto,
  IconDownload,
} from "@tabler/icons-react";
import ConfirmModal from "@/components/confirm-modal";
import type {
  LogoVariant,
  LogoVariantType,
  FaviconSet,
} from "@/types/brand-profile";

interface LogoUploadCardProps {
  projectId: string;
  variant: LogoVariantType;
  label: string;
  description: string;
  logo: LogoVariant | undefined;
  favicons: FaviconSet | undefined;
}

export function LogoUploadCard({
  projectId,
  variant,
  label,
  description,
  logo,
  favicons,
}: LogoUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large. Max 5MB");
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("variant", variant);

      try {
        const res = await fetch(`/api/projects/${projectId}/logos`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          toast.error(data.error ?? "Upload failed");
          return;
        }

        toast.success(`${label} uploaded`);
        router.refresh();
      } catch {
        toast.error("Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [projectId, variant, label, router]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/logos?variant=${variant}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }

      toast.success(`${label} removed`);
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const showFavicons = variant === "square" && logo && favicons;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">{label}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {logo && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              {isDeleting ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconTrash className="size-4" />
              )}
            </Button>
          )}
        </div>

        {logo ? (
          <div
            className="relative group cursor-pointer rounded-lg border bg-muted/50 p-4 flex items-center justify-center min-h-[140px]"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${logo.url}?t=${Date.now()}`}
              alt={label}
              className="max-h-[120px] max-w-full object-contain"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-medium flex items-center gap-1">
                <IconUpload className="size-4" />
                Replace
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center min-h-[140px] transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            }`}
            onClick={() => !isUploading && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <IconPhoto className="size-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Drop image or click to upload
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  PNG, JPG, WebP — max 5MB
                </p>
              </>
            )}
          </div>
        )}

        {showFavicons && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">
              Generated Favicons
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { url: favicons.favicon16, size: "16×16" },
                { url: favicons.favicon32, size: "32×32" },
                { url: favicons.favicon180, size: "180×180" },
              ].map(({ url, size }) => (
                <a
                  key={size}
                  href={url}
                  download
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <IconDownload className="size-3" />
                  {size}
                </a>
              ))}
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </CardContent>
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${label}`}
        message={`Are you sure you want to delete the ${label.toLowerCase()}? This action is irreversible.`}
        isLoading={isDeleting}
      />
    </Card>
  );
}
