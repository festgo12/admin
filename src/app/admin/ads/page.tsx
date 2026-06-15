'use client';

import { AdsTable } from '@/components/admin/ads-table';

export default function AdsPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-bold tracking-tight">Advertisement Management</h1>
        <p className="text-muted-foreground">
          Monitor trade advertisements, manage sponsored listings, and ensure market integrity.
        </p>
      </div>

      <AdsTable />
    </div>
  );
}
