'use client';

import { AdminSidebar } from '@/components/admin/sidebar';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/");
      } else if (!ADMIN_ROLES.includes(user.role)) {
        router.replace("/");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !ADMIN_ROLES.includes(user.role)) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
