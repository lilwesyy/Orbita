"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconArrowLeft,
  IconBrush,
  IconChartBar,
  IconClock,
  IconDashboard,
  IconDatabase,
  IconFile,
  IconFileDescription,
  IconLock,
  IconFolder,
  IconUserCircle,
  IconMail,
  IconHelp,
  IconInnerShadowTop,
  IconLayoutDashboard,
  IconListCheck,
  IconReport,
  IconBrandGithub,
  IconSearch,
  IconSeo,
  IconSettings,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain, type NavMainItem } from "@/components/nav-main"
import { NavSecondary, type NavSecondaryItem } from "@/components/nav-secondary"
import { Kbd } from "@/components/ui/kbd"
import { NavUser } from "@/components/nav-user"
import { ProjectSelector } from "@/components/project-selector"
import { EmailConfigDialog } from "@/components/email-config-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { ProjectSummary } from "@/types/project"

const navMain = [
  { title: "Overview", url: "/", icon: IconDashboard },
  { title: "Clients", url: "/clients", icon: IconUsers },
  { title: "Projects", url: "/projects", icon: IconFolder },
  { title: "Time Tracking", url: "/time-tracking", icon: IconClock },
  { title: "Invoices", url: "/invoices", icon: IconFileDescription },
  { title: "Email", url: "/email", icon: IconMail },
]

const documents = [
  { name: "Data Archive", url: "#", icon: IconDatabase },
  { name: "Reports", url: "#", icon: IconReport },
  { name: "Analytics", url: "/analytics", icon: IconChartBar },
]

function openSearchDialog() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
  );
}

function SearchKbd() {
  const [isMac, setIsMac] = React.useState(true);
  React.useEffect(() => {
    setIsMac(navigator.platform.includes("Mac"));
  }, []);
  return <Kbd className="ml-auto">{isMac ? "⌘" : "Ctrl "}K</Kbd>;
}

function getNavSecondary(): NavSecondaryItem[] {
  return [
    { title: "Account", url: "/account", icon: IconUserCircle },
    { title: "Settings", url: "/settings", icon: IconSettings },
    { title: "Help", url: "#", icon: IconHelp },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
      onClick: openSearchDialog,
      suffix: <SearchKbd />,
    },
  ];
}

interface ProjectNavGroup {
  label: string
  items: NavMainItem[]
}

function getProjectNav(projectId: string, hasEmailConfig: boolean): ProjectNavGroup[] {
  const base = `/projects/${projectId}`
  return [
    {
      label: "General",
      items: [
        { title: "Overview", url: base, icon: IconLayoutDashboard },
        { title: "Tasks", url: `${base}/tasks`, icon: IconListCheck },
        { title: "Time", url: `${base}/time`, icon: IconClock },
      ],
    },
    {
      label: "Development",
      items: [
        { title: "Database", url: `${base}/database`, icon: IconDatabase },
        { title: "Files", url: `${base}/files`, icon: IconFile },
        { title: "GitHub", url: `${base}/github`, icon: IconBrandGithub },
      ],
    },
    {
      label: "Marketing",
      items: [
        { title: "Branding", url: `${base}/branding`, icon: IconBrush },
        { title: "Ad Maker", url: `${base}/ad-maker`, icon: IconSparkles },
        { title: "SEO", url: `${base}/seo`, icon: IconSeo },
        {
          title: "Email",
          url: `${base}/email`,
          icon: IconMail,
          ...(hasEmailConfig ? { action: <EmailConfigDialog projectId={projectId} /> } : {}),
        },
      ],
    },
    {
      label: "Security",
      items: [
        { title: "Credentials", url: `${base}/credentials`, icon: IconLock },
      ],
    },
  ]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    image?: string | null
  }
  projects: ProjectSummary[]
}

function ProjectNavGroups({ groups }: { groups: ProjectNavGroup[] }) {
  const pathname = usePathname()
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const isExactMatch = /^\/projects\/[^/]+$/.test(item.url)
                const isActive = isExactMatch
                  ? pathname === item.url
                  : pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={item.title} isActive={isActive} asChild>
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.action}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

export function AppSidebar({ user, projects, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  // Extract project ID from URL: /projects/[id] or /projects/[id]/...
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  const activeProjectId = projectMatch?.[1]
  const isProjectContext = !!activeProjectId && activeProjectId !== "new"
  const activeProject = isProjectContext ? projects.find((p) => p.id === activeProjectId) : undefined

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                {isProjectContext && <IconArrowLeft className="!size-5" />}
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Orbita</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {projects.length > 0 && (
          <ProjectSelector
            projects={projects}
            activeProjectId={activeProjectId}
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        {isProjectContext ? (
          <>
            <ProjectNavGroups
              groups={getProjectNav(activeProjectId, activeProject?.hasEmailConfig ?? false)}
            />
            <NavSecondary items={getNavSecondary()} className="mt-auto" />
          </>
        ) : (
          <>
            <NavMain items={navMain} />
            <NavDocuments items={documents} />
            <NavSecondary items={getNavSecondary()} className="mt-auto" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
