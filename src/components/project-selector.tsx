"use client"

import { useRouter } from "next/navigation"
import {
  IconCheck,
  IconChevronDown,
  IconFolder,
} from "@tabler/icons-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ProjectAvatar } from "@/components/project-avatar"
import type { ProjectSummary } from "@/types/project"

const statusLabels: Record<string, string> = {
  PROPOSAL: "Proposal",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

interface ProjectSelectorProps {
  projects: ProjectSummary[]
  activeProjectId?: string
}

export function ProjectSelector({ projects, activeProjectId }: ProjectSelectorProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {activeProject ? (
                <ProjectAvatar
                  logoUrl={activeProject.logoUrl}
                  projectName={activeProject.name}
                  className="size-8 rounded-lg"
                />
              ) : (
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconFolder className="size-4" />
                </div>
              )}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeProject?.name ?? "Select Project"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeProject ? statusLabels[activeProject.status] : "No project selected"}
                </span>
              </div>
              <IconChevronDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Projects
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="gap-2 p-2"
              >
                <ProjectAvatar
                  logoUrl={project.logoUrl}
                  projectName={project.name}
                  className="size-6 rounded-sm"
                />
                <span className="flex-1 truncate">{project.name}</span>
                {project.id === activeProjectId && (
                  <IconCheck className="size-4 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
