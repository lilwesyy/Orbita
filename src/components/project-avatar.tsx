import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectAvatarProps {
  logoUrl: string | null;
  projectName: string;
  className?: string;
}

export function ProjectAvatar({ logoUrl, projectName, className }: ProjectAvatarProps) {
  // Get first letter of project name for fallback
  const fallback = projectName.charAt(0).toUpperCase();

  return (
    <Avatar className={className}>
      {logoUrl && <AvatarImage src={logoUrl} alt={projectName} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}
