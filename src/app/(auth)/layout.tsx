import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="bg-gradient-futuristic p-6 md:p-10"
      style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
