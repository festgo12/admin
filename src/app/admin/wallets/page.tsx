'use client';

import { WalletsTable } from '@/components/admin/wallets-table';

export default function WalletsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Wallet Monitoring</h2>
      </div>
      <WalletsTable />
    </div>
  );
}
