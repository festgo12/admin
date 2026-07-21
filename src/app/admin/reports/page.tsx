'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangeSelector, getDateRange, type QuickRange } from '@/components/admin/reports/date-range-selector';
import { ReportOverview } from '@/components/admin/reports/report-overview';
import { ReportCategoryChart } from '@/components/admin/reports/report-category-chart';
import { ReportDataTable } from '@/components/admin/reports/report-data-table';
import { ReportStatCards } from '@/components/admin/reports/report-stat-cards';
import { ReportExportButtons } from '@/components/admin/reports/report-export-buttons';
import { reportService, type ReportCategory, type ReportCategoryResponse } from '@/services/report-service';
import { format } from 'date-fns';
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  Users,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

function formatCurrency(val: number) {
  return `₦${Number(val).toLocaleString()}`;
}

function formatNumber(val: number) {
  return Number(val).toLocaleString();
}

function CategoryTab({
  category,
  startDate,
  endDate,
  title,
  color,
  chartField,
  statConfig,
  headers,
  rowMapper,
}: {
  category: ReportCategory;
  startDate: string;
  endDate: string;
  title: string;
  color: string;
  chartField: string;
  statConfig: { label: string; key: string; icon: any; iconColor?: string; format: 'currency' | 'number'; subtext?: string }[];
  headers: string[];
  rowMapper: (d: any) => any[];
}) {
  const { data, isLoading } = useQuery<ReportCategoryResponse>({
    queryKey: [`admin-report-${category}`, startDate, endDate],
    queryFn: () => reportService.getReport(category, startDate, endDate),
  });

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-outfit font-bold">{title}</h3>
        <ReportExportButtons category={category} startDate={startDate} endDate={endDate} title={title} />
      </div>

      <ReportStatCards
        loading={isLoading}
        stats={statConfig.map((s) => ({
          label: s.label,
          value: s.format === 'currency'
            ? formatCurrency(Number(data?.summary?.[s.key] || 0))
            : formatNumber(Number(data?.summary?.[s.key] || 0)),
          icon: s.icon,
          iconColor: s.iconColor,
          subtext: s.subtext,
        }))}
      />

      <ReportCategoryChart
        title={`${title} Over Time`}
        data={(data?.series || []).map((d: any) => ({
          date: d.date,
          value: Number(d[chartField] || 0),
        }))}
        color={color}
        format="currency"
        loading={isLoading}
      />

      <ReportDataTable
        title={`${title} - Daily Breakdown`}
        headers={headers}
        rows={(data?.series || []).map((d: any) => rowMapper(d))}
        loading={isLoading}
      />
    </div>
  );
}

export default function ReportsPage() {
  const [range, setRange] = useState<QuickRange>('30d');
  const dateRange = getDateRange(range);

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Platform performance metrics, financial data, and operational insights.
          </p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="trading" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="deposits" className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Deposits
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="gift-cards" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Gift Cards
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="disputes" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Disputes
          </TabsTrigger>
          <TabsTrigger value="fraud" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            Fraud
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ReportOverview startDate={dateRange.startDate} endDate={dateRange.endDate} />
        </TabsContent>

        <TabsContent value="revenue">
          <CategoryTab
            category="revenue"
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            title="Revenue"
            color="bg-green-500"
            chartField="platformFeesNgn"
            statConfig={[
              { label: 'Total Fees', key: 'totalFeesNgn', icon: TrendingUp, iconColor: 'text-green-500', format: 'currency' },
              { label: 'Avg Daily Fees', key: 'avgDailyFeesNgn', icon: TrendingUp, iconColor: 'text-green-400', format: 'currency', subtext: 'per day' },
            ]}
            headers={['Date', 'Platform Fees (NGN)']}
            rowMapper={(d) => [d.date, Number(d.platformFeesNgn)]}
          />
        </TabsContent>

        <TabsContent value="trading">
          <CategoryTab
            category="trading-volume"
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            title="Trading Volume"
            color="bg-blue-500"
            chartField="tradingVolumeNgn"
            statConfig={[
              { label: 'Total Volume (NGN)', key: 'totalVolumeNgn', icon: ShoppingCart, iconColor: 'text-blue-500', format: 'currency' },
              { label: 'Total Orders', key: 'totalOrders', icon: ShoppingCart, iconColor: 'text-blue-400', format: 'number' },
              { label: 'Completed Orders', key: 'completedOrders', icon: ShoppingCart, iconColor: 'text-green-500', format: 'number' },
            ]}
            headers={['Date', 'Volume (NGN)', 'Total Orders', 'Completed']}
            rowMapper={(d) => [d.date, Number(d.tradingVolumeNgn), d.totalOrders, d.completedOrders]}
          />
        </TabsContent>

        <TabsContent value="deposits">
          <CategoryTab
            category="deposits"
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            title="Deposits"
            color="bg-green-600"
            chartField="depositsNgn"
            statConfig={[
              { label: 'Total Deposits', key: 'totalDepositsNgn', icon: ArrowDownToLine, iconColor: 'text-green-500', format: 'currency' },
              { label: 'Total Count', key: 'totalDepositCount', icon: ArrowDownToLine, iconColor: 'text-green-400', format: 'number' },
              { label: 'Avg Daily', key: 'avgDailyDepositsNgn', icon: ArrowDownToLine, iconColor: 'text-green-300', format: 'currency', subtext: 'per day' },
            ]}
            headers={['Date', 'Deposits (NGN)', 'Count']}
            rowMapper={(d) => [d.date, Number(d.depositsNgn), d.depositCount]}
          />
        </TabsContent>

        <TabsContent value="withdrawals">
          <CategoryTab
            category="withdrawals"
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            title="Withdrawals"
            color="bg-orange-500"
            chartField="withdrawalsNgn"
            statConfig={[
              { label: 'Total Withdrawals', key: 'totalWithdrawalsNgn', icon: ArrowUpFromLine, iconColor: 'text-orange-500', format: 'currency' },
              { label: 'Total Count', key: 'totalWithdrawalCount', icon: ArrowUpFromLine, iconColor: 'text-orange-400', format: 'number' },
              { label: 'Avg Daily', key: 'avgDailyWithdrawalsNgn', icon: ArrowUpFromLine, iconColor: 'text-orange-300', format: 'currency', subtext: 'per day' },
            ]}
            headers={['Date', 'Withdrawals (NGN)', 'Count']}
            rowMapper={(d) => [d.date, Number(d.withdrawalsNgn), d.withdrawalCount]}
          />
        </TabsContent>

        <TabsContent value="gift-cards">
          <CategoryTab
            category="gift-cards"
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            title="Gift Cards"
            color="bg-purple-500"
            chartField="giftCardVolumeNgn"
            statConfig={[
              { label: 'Total Volume', key: 'totalGiftCardVolumeNgn', icon: CreditCard, iconColor: 'text-purple-500', format: 'currency' },
              { label: 'Total Orders', key: 'totalGiftCardCount', icon: CreditCard, iconColor: 'text-purple-400', format: 'number' },
            ]}
            headers={['Date', 'Volume (NGN)', 'Orders']}
            rowMapper={(d) => [d.date, Number(d.giftCardVolumeNgn), d.giftCardCount]}
          />
        </TabsContent>

        <TabsContent value="users">
          <CategoryTab
            category="user-growth"
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            title="User Growth"
            color="bg-primary"
            chartField="newUsers"
            statConfig={[
              { label: 'New Users', key: 'newUsers', icon: Users, iconColor: 'text-primary', format: 'number' },
              { label: 'Peak Total Users', key: 'peakTotalUsers', icon: Users, iconColor: 'text-primary', format: 'number' },
            ]}
            headers={['Date', 'New Users', 'Total Users']}
            rowMapper={(d) => [d.date, d.newUsers, d.totalUsers]}
          />
        </TabsContent>

        <TabsContent value="disputes">
          <CategoryTab
            category="disputes"
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            title="Disputes"
            color="bg-yellow-500"
            chartField="newDisputes"
            statConfig={[
              { label: 'New Disputes', key: 'newDisputes', icon: AlertTriangle, iconColor: 'text-yellow-500', format: 'number' },
              { label: 'Resolved', key: 'resolvedDisputes', icon: AlertTriangle, iconColor: 'text-green-500', format: 'number' },
              { label: 'Resolution Rate', key: 'resolutionRate', icon: AlertTriangle, iconColor: 'text-blue-500', format: 'number', subtext: '%' },
            ]}
            headers={['Date', 'New Disputes', 'Resolved']}
            rowMapper={(d) => [d.date, d.newDisputes, d.resolvedDisputes]}
          />
        </TabsContent>

        <TabsContent value="fraud">
          <CategoryTab
            category="fraud"
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            title="Fraud Events"
            color="bg-red-500"
            chartField="fraudEvents"
            statConfig={[
              { label: 'Total Fraud Events', key: 'totalFraudEvents', icon: ShieldAlert, iconColor: 'text-red-500', format: 'number' },
            ]}
            headers={['Date', 'Fraud Events']}
            rowMapper={(d) => [d.date, d.fraudEvents]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
