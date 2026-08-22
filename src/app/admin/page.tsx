'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminService.getDashboardStats,
  });

  const cards = [
    {
      name: 'Total Users',
      value: isLoading ? '—' : stats?.totalUsers?.toLocaleString() ?? '0',
      icon: Users,
      description: 'Registered platform users',
    },
    {
      name: 'Total Trades',
      value: isLoading ? '—' : stats?.totalOrders?.toLocaleString() ?? '0',
      icon: ShoppingBag,
      description: `${stats?.completionRate ?? 0}% completion rate`,
    },
    {
      name: 'Total Revenue',
      value: isLoading ? '—' : `₦${stats?.totalRevenue?.toLocaleString() ?? '0'}`,
      icon: TrendingUp,
      description: 'Fees collected from trades',
    },
    {
      name: 'Pending Disputes',
      value: isLoading ? '—' : stats?.pendingDisputes?.toLocaleString() ?? '0',
      icon: AlertTriangle,
      description: 'Disputes awaiting review',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-bold tracking-tight">
          System Dashboard
        </h1>
        <p className="text-muted-foreground">
          Real-time overview of the P2N Marketplace performance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => (
          <Card
            key={stat.name}
            className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-outfit font-bold tracking-tight">
                {isLoading ? (
                  <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Welcome to P2N Admin Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the sidebar to manage users, monitor wallets, and resolve
            disputes. Detailed analytics and logs are available in the Reports
            section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
