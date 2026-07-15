'use client';

import { useQuery } from '@tanstack/react-query';
import { adminSecurityService, RiskOverview } from '@/services/admin-security-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, AlertTriangle, Activity, ShieldCheck } from 'lucide-react';

function RiskGauge({ score, label }: { score: number; label: string }) {
  const percentage = Math.min(100, Math.max(0, score));
  const color =
    percentage >= 80 ? 'bg-green-500' :
    percentage >= 50 ? 'bg-yellow-500' :
    percentage >= 25 ? 'bg-orange-500' :
    'bg-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, label }: { data: { label: string; value: number; color: string }[]; label: string }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      {data.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>{item.label}</span>
            <span className="font-mono text-muted-foreground">{item.value}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${item.color}`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RiskDashboard() {
  const { data: overview, isLoading } = useQuery<RiskOverview>({
    queryKey: ['admin-security-risk-overview'],
    queryFn: adminSecurityService.getRiskOverview,
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-md" />
          ))}
        </div>
        <div className="h-[300px] bg-muted rounded-md w-full" />
      </div>
    );
  }

  const users = overview?.users;
  const threats = overview?.threats;
  const alertSeverity = overview?.alerts.bySeverity || [];

  const activeUsers = (users?.total || 0) - (users?.frozen || 0) - (users?.suspended || 0);
  const healthScore = users?.total
    ? Math.round(((activeUsers / users.total) * 100))
    : 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">active / total users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threats?.failedLogins24h || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">authentication failures</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud Flags (7d)</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threats?.fraudFlaggedOrders7d || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">flagged orders this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disputes (7d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threats?.disputes7d || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">disputes opened this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RiskGauge score={healthScore} label="Healthy Accounts" />
            <HorizontalBarChart
              label="Account Status"
              data={[
                { label: 'Active', value: activeUsers, color: 'bg-green-500' },
                { label: 'Frozen', value: users?.frozen || 0, color: 'bg-yellow-500' },
                { label: 'Suspended', value: users?.suspended || 0, color: 'bg-red-500' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Security Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">2FA Adoption</span>
                <span className="font-medium">{users?.twoFaRate || 0}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${users?.twoFaRate || 0}%` }}
                />
              </div>
            </div>
            <HorizontalBarChart
              label="Alerts by Severity"
              data={alertSeverity.map((s) => ({
                label: s.severity,
                value: s.count,
                color:
                  s.severity === 'CRITICAL' ? 'bg-red-500' :
                  s.severity === 'HIGH' ? 'bg-orange-500' :
                  s.severity === 'MEDIUM' ? 'bg-yellow-500' :
                  'bg-green-500',
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
