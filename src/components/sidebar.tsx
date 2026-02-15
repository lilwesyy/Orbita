'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logout } from '@/actions/auth';
import type { Session } from 'next-auth';
import { Menu, X, Home, Users, FolderOpen, Clock, FileText, LogOut } from 'lucide-react';

interface SidebarProps {
  session: Session;
}

interface NavItem {
  name: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: <Home className="w-5 h-5" /> },
  { name: 'Clients', href: '/clients', icon: <Users className="w-5 h-5" /> },
  { name: 'Projects', href: '/projects', icon: <FolderOpen className="w-5 h-5" /> },
  { name: 'Time Tracking', href: '/time-tracking', icon: <Clock className="w-5 h-5" /> },
  { name: 'Invoices', href: '/invoices', icon: <FileText className="w-5 h-5" /> },
];

export default function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64
          glass border-r border-border/50
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b border-border/50">
            <h1 className="text-xl font-bold text-primary">Orbita</h1>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border/50">
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-foreground truncate">
                {session.user?.name || session.user?.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user?.email}
              </p>
            </div>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
