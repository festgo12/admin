'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export function BlockchainMonitoring() {
  const { data: stats } = useQuery({
    queryKey: ['blockchain-stats'],
    queryFn: adminService.getBlockchainStats,
    refetchInterval: 10000, // Refresh every 10s
  });

  const { data: txData, isLoading } = useQuery({
    queryKey: ['blockchain-transactions'],
    queryFn: () => adminService.getBlockchainTransactions(1, 10),
    refetchInterval: 5000, // Refresh every 5s for real-time feel
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats?.balances.map((b: any) => (
          <Card key={b.currency}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total {b.currency}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{b.total.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions (24h)</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.txCount24h || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference/TxID</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : txData?.transactions?.map((tx: any) => (
              <TableRow key={tx.id}>
                <TableCell>
                  {tx.type === 'DEPOSIT' ? (
                    <ArrowDownLeft className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-blue-500" />
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-xs font-medium">{tx.wallet.user.email}</p>
                </TableCell>
                <TableCell>
                   <Badge variant="outline">{tx.wallet.currency}</Badge>
                </TableCell>
                <TableCell className="font-mono">
                  {tx.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge 
                    className={
                      tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 
                      tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' : 
                      'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                    }
                  >
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-[10px] text-muted-foreground max-w-[150px] truncate">
                  {tx.reference}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(tx.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
