import type { ReactNode } from 'react';
import { unstable_cache } from 'next/cache';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SearchDialog } from '@/components/search-dialog';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { ProjectSummary } from '@/types/project';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { name: true, email: true, image: true },
  });

  const user = {
    name: dbUser?.name || session.user.name || session.user.email || 'Utente',
    email: dbUser?.email || session.user.email || '',
    image: dbUser?.image ?? null,
  };

  const getSidebarProjects = unstable_cache(
    async (): Promise<ProjectSummary[]> => {
      const rows = await prisma.project.findMany({
        select: { id: true, name: true, status: true, logoUrl: true, emailConfig: { select: { id: true } } },
        orderBy: { name: 'asc' },
      });
      return rows.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        logoUrl: p.logoUrl,
        hasEmailConfig: !!p.emailConfig,
      }));
    },
    ['sidebar-projects'],
    { revalidate: 60, tags: ['projects'] }
  );

  const projects = await getSidebarProjects();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} projects={projects} />
      <SearchDialog />
      <SidebarInset className="overflow-hidden">
        <SiteHeader projects={projects} />
        <div className="@container/main flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
