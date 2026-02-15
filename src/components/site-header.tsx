"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const pathLabels: Record<string, string> = {
  "": "Overview",
  clients: "Clients",
  projects: "Projects",
  "time-tracking": "Time Tracking",
  invoices: "Invoices",
}

const projectSubPageLabels: Record<string, string> = {
  tasks: "Tasks",
  time: "Time",
  database: "Database",
  files: "Files",
  branding: "Branding",
  email: "Email",
  edit: "Edit",
  "ad-maker": "Ad Maker",
  credentials: "Credentials",
}

export function SiteHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  let title: string

  // Check if we're in a project context: /projects/[id]/[subpage]
  if (segments[0] === "projects" && segments[1] && segments[1] !== "new") {
    const subPage = segments[2]
    if (subPage && projectSubPageLabels[subPage]) {
      title = projectSubPageLabels[subPage]
    } else {
      title = "Overview"
    }
  } else {
    const firstSegment = segments[0] || ""
    title =
      pathLabels[firstSegment] ||
      firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
