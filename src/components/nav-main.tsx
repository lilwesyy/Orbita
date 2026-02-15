"use client"

import { useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmailComposeDialog } from "@/components/email-compose-dialog"
import { ProjectForm } from "@/components/project-form"
import { createProjectInDialog } from "@/actions/projects"
import { getClients } from "@/actions/clients"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Client } from "@/generated/prisma/client"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavMainItem {
  title: string
  url: string
  icon?: Icon
  action?: ReactNode
}

export function NavMain({
  items,
  showCreateButton = true,
}: {
  items: NavMainItem[]
  showCreateButton?: boolean
}) {
  const pathname = usePathname()
  const [composeOpen, setComposeOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, startLoadClients] = useTransition()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {showCreateButton && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Create New"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                onClick={() => {
                  setProjectOpen(true)
                  startLoadClients(async () => {
                    const data = await getClients()
                    setClients(data)
                  })
                }}
              >
                <IconCirclePlusFilled />
                <span>Create New</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
                onClick={() => setComposeOpen(true)}
              >
                <IconMail />
                <span className="sr-only">Compose Email</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <EmailComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
        <Dialog open={projectOpen} onOpenChange={setProjectOpen}>
          <DialogContent className="max-w-xl sm:max-w-xl gap-0 px-0 pt-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>New Project</DialogTitle>
              <DialogDescription>Create a new project</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="px-6 pb-6">
                {isLoadingClients ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ProjectForm
                    clients={clients}
                    action={createProjectInDialog}
                    onSuccess={() => setProjectOpen(false)}
                  />
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <SidebarMenu>
          {items.map((item) => {
            // For root "/" or project overview URLs like "/projects/[id]",
            // use exact match; otherwise use startsWith
            const isExactMatch = item.url === "/" || /^\/projects\/[^/]+$/.test(item.url)
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
  )
}
