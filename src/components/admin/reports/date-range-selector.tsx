'use client';

import { subDays, subMonths, startOfDay, endOfDay, format } from 'date-fns';

export type QuickRange = 'today' | '7d' | '30d' | '90d' | '12m';

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

const QUICK_RANGES: { value: QuickRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '12m', label: '12 Months' },
];

export function getDateRange(range: QuickRange): DateRange {
  const now = new Date();
  const endDate = format(endOfDay(now), 'yyyy-MM-dd');
  let startDate: string;
  let label: string;

  switch (range) {
    case 'today':
      startDate = format(startOfDay(now), 'yyyy-MM-dd');
      label = 'Today';
      break;
    case '7d':
      startDate = format(startOfDay(subDays(now, 6)), 'yyyy-MM-dd');
      label = 'Last 7 Days';
      break;
    case '30d':
      startDate = format(startOfDay(subDays(now, 29)), 'yyyy-MM-dd');
      label = 'Last 30 Days';
      break;
    case '90d':
      startDate = format(startOfDay(subDays(now, 89)), 'yyyy-MM-dd');
      label = 'Last 90 Days';
      break;
    case '12m':
      startDate = format(startOfDay(subMonths(now, 12)), 'yyyy-MM-dd');
      label = 'Last 12 Months';
      break;
  }

  return { startDate, endDate, label };
}

interface DateRangeSelectorProps {
  value: QuickRange;
  onChange: (range: QuickRange) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {QUICK_RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
            value === r.value
              ? 'bg-background text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
