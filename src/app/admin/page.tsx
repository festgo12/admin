'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react';

const stats = [
  { name: 'Total Users', value: '10', icon: Users, description: 'Registered platform users' },
  { name: 'Total Trades', value: '0', icon: ShoppingBag, description: 'Completed P2P transactions' },
  { name: 'Total Revenue', value: '₦0', icon: TrendingUp, description: 'Fees collected from trades' },
  { name: 'Pending Disputes', value: '0', icon: AlertTriangle, description: 'Disputes awaiting review' },
];

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-bold tracking-tight">System Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time overview of the P2N Marketplace performance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-outfit font-bold tracking-tight">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <span className="text-success-foreground font-medium">+12%</span>
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
            Use the sidebar to manage users, monitor wallets, and resolve disputes.
            Detailed analytics and logs are available in the Reports section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
