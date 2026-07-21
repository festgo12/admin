'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type LucideIcon } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  subtext?: string;
}

interface ReportStatCardsProps {
  stats: StatItem[];
  loading?: boolean;
}

export function ReportStatCards({ stats, loading }: ReportStatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <stat.icon className={`h-4 w-4 ${stat.iconColor || 'text-primary'}`} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
            )}
            {stat.subtext && (
              <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
