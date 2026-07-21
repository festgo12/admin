'use client';

import { useQuery } from '@tanstack/react-query';
import { reportService, type ReportOverview } from '@/services/report-service';
import { ReportCategoryChart } from './report-category-chart';
import {
  TrendingUp,
  ShoppingCart,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  Users,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportOverviewProps {
  startDate: string;
  endDate: string;
}

export function ReportOverview({ startDate, endDate }: ReportOverviewProps) {
  const { data, isLoading } = useQuery<ReportOverview>({
    queryKey: ['admin-reports-overview', startDate, endDate],
    queryFn: () => reportService.getOverview(startDate, endDate),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[250px] bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{Number(s?.platformFeesNgn || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trading Volume</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{Number(s?.tradingVolumeNgn || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{s?.completedOrders || 0} completed trades</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deposits</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{Number(s?.depositsNgn || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{s?.depositCount || 0} transactions</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Withdrawals</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{Number(s?.withdrawalsNgn || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{s?.withdrawalCount || 0} transactions</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gift Card Volume</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{Number(s?.giftCardVolumeNgn || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{s?.giftCardCount || 0} orders</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s?.newUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{s?.totalUsers || 0} total users</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s?.newDisputes || 0}</div>
            <p className="text-xs text-muted-foreground">{s?.resolvedDisputes || 0} resolved</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fraud Events</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{s?.fraudEvents || 0}</div>
            <p className="text-xs text-muted-foreground">flagged events</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReportCategoryChart
          title="Revenue (Platform Fees)"
          data={(data?.series || []).map((d) => ({ date: d.date, value: Number(d.platformFeesNgn) }))}
          color="bg-green-500"
          format="currency"
        />
        <ReportCategoryChart
          title="Trading Volume"
          data={(data?.series || []).map((d) => ({ date: d.date, value: Number(d.tradingVolumeNgn) }))}
          color="bg-blue-500"
          format="currency"
        />
        <ReportCategoryChart
          title="Deposits"
          data={(data?.series || []).map((d) => ({ date: d.date, value: Number(d.depositsNgn) }))}
          color="bg-green-600"
          format="currency"
        />
        <ReportCategoryChart
          title="Withdrawals"
          data={(data?.series || []).map((d) => ({ date: d.date, value: Number(d.withdrawalsNgn) }))}
          color="bg-orange-500"
          format="currency"
        />
        <ReportCategoryChart
          title="Gift Card Volume"
          data={(data?.series || []).map((d) => ({ date: d.date, value: Number(d.giftCardVolumeNgn) }))}
          color="bg-purple-500"
          format="currency"
        />
        <ReportCategoryChart
          title="User Growth"
          data={(data?.series || []).map((d) => ({ date: d.date, value: d.newUsers }))}
          color="bg-primary"
          format="number"
        />
        <ReportCategoryChart
          title="Disputes"
          data={(data?.series || []).map((d) => ({ date: d.date, value: d.newDisputes }))}
          color="bg-yellow-500"
          format="number"
        />
        <ReportCategoryChart
          title="Fraud Events"
          data={(data?.series || []).map((d) => ({ date: d.date, value: d.fraudEvents }))}
          color="bg-red-500"
          format="number"
        />
      </div>
    </div>
  );
}
