'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface ReportCategoryChartProps {
  title: string;
  data: ChartDataPoint[];
  color?: string;
  format?: 'currency' | 'number' | 'compact';
  loading?: boolean;
}

function formatValue(value: number, fmt: string): string {
  switch (fmt) {
    case 'currency':
      return `₦${Number(value).toLocaleString()}`;
    case 'compact':
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return Number(value).toLocaleString();
    default:
      return Number(value).toLocaleString();
  }
}

export function ReportCategoryChart({
  title,
  data,
  color = 'bg-primary',
  format: fmt = 'currency',
  loading,
}: ReportCategoryChartProps) {
  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No data available for this period.</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((point) => {
            const percentage = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
            const dateLabel = (() => {
              try {
                return format(new Date(point.date), 'MMM d');
              } catch {
                return point.date;
              }
            })();

            return (
              <div key={point.date} className="flex items-center gap-3">
                <div className="w-12 text-xs text-muted-foreground text-right shrink-0">
                  {dateLabel}
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm transition-all ${color}`}
                      style={{ width: `${Math.max(percentage, point.value > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right text-xs font-mono shrink-0">
                  {formatValue(point.value, fmt)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
