"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectLogoUploadProps {
  projectId: string;
  projectName: string;
  logoUrl: string | null;
}

export function ProjectLogoUpload({
  projectId,
  projectName,
  logoUrl,
}: ProjectLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Max 2MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/projects/${projectId}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
        return;
      }

      toast.success("Logo updated");
      router.refresh();
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const triggerUpload = () => {
    if (!isUploading) inputRef.current?.click();
  };

  const fallback = projectName.charAt(0).toUpperCase();

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className="group relative shrink-0 cursor-pointer items-center justify-center overflow-hidden transition-colors hover:bg-accent"
              onClick={triggerUpload}
              role="button"
              aria-label={logoUrl ? "Change project logo" : "Add project logo"}
              style={{ width: 64, height: 64, padding: 0, gap: 0 }}
            >
              {isUploading ? (
                <div className="flex size-full items-center justify-center bg-muted">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Avatar className="size-full rounded-none">
                  {logoUrl && <AvatarImage src={logoUrl} alt={projectName} />}
                  <AvatarFallback className="rounded-none text-2xl">
                    {fallback}
                  </AvatarFallback>
                </Avatar>
              )}
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{logoUrl ? "Click to change logo" : "Click to upload a logo"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
