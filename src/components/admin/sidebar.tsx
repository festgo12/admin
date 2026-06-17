'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  TrendingUp,
  Wallet,
  CreditCard,
  AlertTriangle,
  FileText,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Advertisements', href: '/admin/ads', icon: TrendingUp },
  { name: 'Wallets', href: '/admin/wallets', icon: Wallet },
  { name: 'Gift Cards', href: '/admin/gift-cards', icon: CreditCard },
  { name: 'Disputes', href: '/admin/disputes', icon: AlertTriangle },
  { name: 'Paystack Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Security Center', href: '/admin/security', icon: ShieldCheck },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg">
          <span className="text-xl font-bold text-primary-foreground">P2N</span>
        </div>
        <span className="font-outfit font-bold text-lg">Admin Portal</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border space-y-4">
        {user && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{user.profile.firstName} {user.profile.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
