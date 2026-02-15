"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconUpload, IconTrash, IconCamera } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AccountAvatarUploadProps {
  image: string | null;
  name: string;
}

export function AccountAvatarUpload({ image, name }: AccountAvatarUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      alert("File too large. Max 2MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Upload failed");
        return;
      }
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setUploading(true);
    try {
      await fetch("/api/users/avatar", { method: "DELETE" });
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>
          Your profile picture. Click to upload a new one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <button
          type="button"
          className="group relative cursor-pointer rounded-full"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Avatar className="h-24 w-24">
            {image && <AvatarImage src={image} alt={name} />}
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <IconCamera className="size-6 text-white" />
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <IconUpload className="size-4" />
            {image ? "Change" : "Upload"}
          </Button>
          {image && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
              className="text-destructive"
            >
              <IconTrash className="size-4" />
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
