'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import type { Session } from 'next-auth';

interface HeaderProps {
  session: Session;
}

const pathLabels: Record<string, string> = {
  '': 'Dashboard',
  'clients': 'Clients',
  'projects': 'Projects',
  'time-tracking': 'Time Tracking',
  'invoices': 'Invoices',
};

export default function Header({ session }: HeaderProps) {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{ label: string; isLast: boolean }> = [];

    if (segments.length === 0) {
      breadcrumbs.push({ label: 'Dashboard', isLast: true });
    } else {
      breadcrumbs.push({ label: 'Home', isLast: false });
      segments.forEach((segment, index) => {
        const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({
          label,
          isLast: index === segments.length - 1,
        });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-10 glass border-b border-border/50">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
                  )}
                  <span
                    className={
                      crumb.isLast
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {crumb.label}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          <span className="hidden sm:block text-sm text-muted-foreground">
            {session.user?.name || session.user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
