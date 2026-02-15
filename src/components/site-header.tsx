"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbEntry {
  label: string
  href?: string
}

const topLevelLabels: Record<string, string> = {
  clients: "Clients",
  projects: "Projects",
  "time-tracking": "Time Tracking",
  invoices: "Invoices",
  analytics: "Analytics",
  email: "Email",
  account: "Account",
  settings: "Settings",
}

const projectSubLabels: Record<string, string> = {
  tasks: "Tasks",
  time: "Time",
  database: "Database",
  files: "Files",
  branding: "Branding",
  email: "Email",
  edit: "Edit",
  "ad-maker": "Ad Maker",
  credentials: "Credentials",
  github: "GitHub",
  seo: "SEO",
}

interface SiteHeaderProps {
  projects?: { id: string; name: string }[]
}

export function SiteHeader({ projects = [] }: SiteHeaderProps) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const crumbs: BreadcrumbEntry[] = []

  if (segments.length === 0) {
    crumbs.push({ label: "Dashboard" })
  } else if (segments[0] === "projects") {
    crumbs.push({ label: "Projects", href: "/projects" })

    if (segments[1]) {
      if (segments[1] === "new") {
        crumbs.push({ label: "New" })
      } else {
        const projectId = segments[1]
        const project = projects.find((p) => p.id === projectId)
        const projectName = project?.name ?? projectId.slice(0, 8)

        if (segments[2]) {
          crumbs.push({ label: projectName, href: `/projects/${projectId}` })
          const subLabel = projectSubLabels[segments[2]] ?? segments[2]
          crumbs.push({ label: subLabel })
        } else {
          crumbs.push({ label: projectName })
        }
      }
    }
  } else if (segments[0] === "clients") {
    crumbs.push({ label: "Clients", href: segments[1] ? "/clients" : undefined })

    if (segments[1] === "new") {
      crumbs.push({ label: "New" })
    } else if (segments[1] && segments[2] === "edit") {
      crumbs.push({ label: "Edit" })
    }
  } else if (segments[0] === "invoices") {
    crumbs.push({ label: "Invoices", href: segments[1] ? "/invoices" : undefined })

    if (segments[1] === "new") {
      crumbs.push({ label: "New" })
    } else if (segments[1]) {
      if (segments[2] === "edit") {
        crumbs.push({ label: `#${segments[1].slice(0, 8)}`, href: `/invoices/${segments[1]}` })
        crumbs.push({ label: "Edit" })
      } else {
        crumbs.push({ label: `#${segments[1].slice(0, 8)}` })
      }
    }
  } else {
    const label = topLevelLabels[segments[0]] ?? segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
    crumbs.push({ label })
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1
              return (
                <span key={crumb.label + i} className="inline-flex items-center gap-1.5 sm:gap-2.5">
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href!}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
