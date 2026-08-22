'use client';

import { WalletsTable } from '@/components/admin/wallets-table';
import { BlockchainMonitoring } from '@/components/admin/blockchain-monitoring';
import { FailedTransactionsTable } from '@/components/admin/failed-transactions-table';
import { PlatformFeeWallets } from '@/components/admin/platform-fee-wallets';
import { WithdrawalJobsTable } from '@/components/admin/withdrawal-jobs-table';
import { TestnetFaucet } from '@/components/admin/testnet-faucet';
import { OnChainHistory } from '@/components/admin/on-chain-history';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WalletsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Wallet Monitoring</h2>
      </div>
      
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Wallet List</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain Monitoring</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawal Queue</TabsTrigger>
          <TabsTrigger value="failed">Failed Queue</TabsTrigger>
          <TabsTrigger value="platform">Platform Wallets</TabsTrigger>
          <TabsTrigger value="testnet">Testnet</TabsTrigger>
          <TabsTrigger value="onchain">On-Chain History</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <WalletsTable />
        </TabsContent>
        <TabsContent value="blockchain" className="space-y-4">
          <BlockchainMonitoring />
        </TabsContent>
        <TabsContent value="withdrawals" className="space-y-4">
          <WithdrawalJobsTable />
        </TabsContent>
        <TabsContent value="failed" className="space-y-4">
          <FailedTransactionsTable />
        </TabsContent>
        <TabsContent value="platform" className="space-y-4">
          <PlatformFeeWallets />
        </TabsContent>
        <TabsContent value="testnet" className="space-y-4">
          <TestnetFaucet />
        </TabsContent>
        <TabsContent value="onchain" className="space-y-4">
          <OnChainHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
