'use client';

import { useQuery } from '@tanstack/react-query';
import { adminSecurityService, RiskOverview, AlertStats } from '@/services/admin-security-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Users, AlertTriangle, Activity, Lock, Unlock, Eye, TrendingUp } from 'lucide-react';

function StatCard({ title, value, icon: Icon, description, color = 'text-primary' }: {
  title: string;
  value: string | number;
  icon: any;
  description: string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function SeverityBar({ severity, count, total }: { severity: string; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const colorMap: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-green-500',
  };
  const textColorMap: Record<string, string> = {
    CRITICAL: 'text-red-500',
    HIGH: 'text-orange-500',
    MEDIUM: 'text-yellow-500',
    LOW: 'text-green-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${textColorMap[severity] || 'text-muted-foreground'}`}>{severity}</span>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorMap[severity] || 'bg-primary'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function SecurityOverview() {
  const { data: riskOverview, isLoading: riskLoading } = useQuery<RiskOverview>({
    queryKey: ['admin-security-risk-overview'],
    queryFn: adminSecurityService.getRiskOverview,
  });

  const { data: alertStats, isLoading: alertsLoading } = useQuery<AlertStats>({
    queryKey: ['admin-security-alert-stats'],
    queryFn: adminSecurityService.getAlertStats,
  });

  if (riskLoading || alertsLoading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-md" />
          ))}
        </div>
        <div className="h-[200px] bg-muted rounded-md w-full" />
      </div>
    );
  }

  const totalAlerts = alertStats?.total || 0;
  const severityData = alertStats?.bySeverity || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={riskOverview?.users.total || 0}
          icon={Users}
          description={`${riskOverview?.users.twoFaRate || 0}% have 2FA enabled`}
        />
        <StatCard
          title="Frozen / Suspended"
          value={`${riskOverview?.users.frozen || 0} / ${riskOverview?.users.suspended || 0}`}
          icon={Lock}
          description="Accounts requiring attention"
          color="text-orange-500"
        />
        <StatCard
          title="Failed Logins (24h)"
          value={riskOverview?.threats.failedLogins24h || 0}
          icon={AlertTriangle}
          description="Authentication failures today"
          color="text-red-500"
        />
        <StatCard
          title="Fraud Flags (7d)"
          value={riskOverview?.threats.fraudFlaggedOrders7d || 0}
          icon={Eye}
          description="Suspicious orders this week"
          color="text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Alerts by Severity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {severityData.length > 0 ? (
              severityData.map((item) => (
                <SeverityBar
                  key={item.severity}
                  severity={item.severity}
                  count={item.count}
                  total={totalAlerts}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No alerts recorded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Threat Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active 2FA Users</span>
              <span className="font-medium">{riskOverview?.users.with2FA || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Disputes (7d)</span>
              <span className="font-medium">{riskOverview?.threats.disputes7d || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unread Alerts</span>
              <span className="font-medium text-orange-500">{alertStats?.unread || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Alerts</span>
              <span className="font-medium">{totalAlerts}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
