'use client';

import { useQuery } from '@tanstack/react-query';
import { disputeService, DisputeStats } from '@/services/dispute-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Timer,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

function getStatusColor(status: string) {
  switch (status) {
    case 'OPEN': return 'text-orange-500';
    case 'UNDER_REVIEW': return 'text-blue-500';
    case 'WAITING_FOR_USER': return 'text-yellow-500';
    case 'WAITING_FOR_ADMIN': return 'text-purple-500';
    case 'RESOLVED': return 'text-green-500';
    case 'REJECTED': return 'text-red-500';
    case 'ESCALATED': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case 'OPEN': return 'bg-orange-500/10';
    case 'UNDER_REVIEW': return 'bg-blue-500/10';
    case 'WAITING_FOR_USER': return 'bg-yellow-500/10';
    case 'WAITING_FOR_ADMIN': return 'bg-purple-500/10';
    case 'RESOLVED': return 'bg-green-500/10';
    case 'REJECTED': return 'bg-red-500/10';
    case 'ESCALATED': return 'bg-red-600/10';
    default: return 'bg-muted';
  }
}

function formatHours(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function ResolutionDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dispute-stats'],
    queryFn: disputeService.getStats,
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-md" />
          ))}
        </div>
        <div className="h-48 bg-muted rounded-md" />
      </div>
    );
  }

  const activeDisputes = stats
    ? (stats.byStatus.find((s) => s.status === 'OPEN')?.count || 0) +
      (stats.byStatus.find((s) => s.status === 'UNDER_REVIEW')?.count || 0) +
      (stats.byStatus.find((s) => s.status === 'WAITING_FOR_USER')?.count || 0) +
      (stats.byStatus.find((s) => s.status === 'WAITING_FOR_ADMIN')?.count || 0) +
      (stats.byStatus.find((s) => s.status === 'ESCALATED')?.count || 0)
    : 0;

  const resolvedCount = stats?.byStatus.find((s) => s.status === 'RESOLVED')?.count || 0;
  const rejectedCount = stats?.byStatus.find((s) => s.status === 'REJECTED')?.count || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.last24h || 0} in the last 24h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Queue</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{activeDisputes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Needs attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{resolvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {rejectedCount} rejected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.avgResolutionHours ? formatHours(stats.avgResolutionHours) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.avgResolutionHours ? 'average time to resolve' : 'No resolved disputes yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-outfit">Status Distribution</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.byStatus.map((item) => {
              const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
              return (
                <div key={item.status} className="flex items-center gap-4">
                  <div className="w-36">
                    <Badge variant="outline" className={`${getStatusColor(item.status)} ${getStatusBg(item.status)} border-0`}>
                      {item.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.status === 'RESOLVED' ? 'bg-green-500' :
                          item.status === 'REJECTED' ? 'bg-red-500' :
                          item.status === 'ESCALATED' ? 'bg-red-600' :
                          item.status === 'OPEN' ? 'bg-orange-500' :
                          item.status === 'UNDER_REVIEW' ? 'bg-blue-500' :
                          item.status === 'WAITING_FOR_USER' ? 'bg-yellow-500' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-bold">{item.count}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({Math.round(percentage)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {(!stats?.byStatus || stats.byStatus.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No dispute data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
