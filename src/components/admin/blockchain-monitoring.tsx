'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ArrowUpRight, ArrowDownLeft, RefreshCw, DollarSign, Clock, Webhook } from 'lucide-react';
import { toast } from 'sonner';

export function BlockchainMonitoring() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['blockchain-stats'],
    queryFn: adminService.getBlockchainStats,
    refetchInterval: 10000,
  });

  const { data: txData, isLoading } = useQuery({
    queryKey: ['blockchain-transactions'],
    queryFn: () => adminService.getBlockchainTransactions(1, 10),
    refetchInterval: 5000,
  });

  const { data: webhookData } = useQuery({
    queryKey: ['webhook-subscriptions'],
    queryFn: adminService.getWebhookSubscriptions,
    refetchInterval: 30000,
  });

  const syncMutation = useMutation({
    mutationFn: adminService.syncAllBalances,
    onSuccess: (data) => {
      toast.success(`Balance sync complete: ${data.synced}/${data.total} wallets synced, ${data.discrepancies} discrepancies`);
      queryClient.invalidateQueries({ queryKey: ['blockchain-stats'] });
    },
    onError: () => toast.error('Balance sync failed'),
  });

  const refreshRatesMutation = useMutation({
    mutationFn: adminService.refreshExchangeRates,
    onSuccess: () => {
      toast.success('Exchange rates refreshed');
      queryClient.invalidateQueries({ queryKey: ['blockchain-stats'] });
    },
    onError: () => toast.error('Failed to refresh exchange rates'),
  });

  const initWebhooksMutation = useMutation({
    mutationFn: adminService.initOutgoingWebhooks,
    onSuccess: () => {
      toast.success('Outgoing webhooks initialized');
      queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] });
    },
    onError: () => toast.error('Failed to initialize webhooks'),
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats?.balances?.map((b: any) => (
          <Card key={b.currency}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total {b.currency}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{b.total.toLocaleString()}</div>
              {b.valueInNgn > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ~₦{b.valueInNgn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              )}
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
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.successRate || 0}% success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exchange Rates + Webhook Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Live Exchange Rates (NGN)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshRatesMutation.mutate()}
              disabled={refreshRatesMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshRatesMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {stats?.exchangeRates && Object.entries(stats.exchangeRates).map(([currency, rate]) => (
                currency !== 'NGN' && (
                  <div key={currency} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-sm font-medium">{currency}</span>
                    <span className="text-sm font-mono">₦{(rate as number).toLocaleString()}</span>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Blockchain Health
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Balances
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending Transactions</span>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">{stats?.pendingCount || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Failed Transactions</span>
                <Badge variant="destructive">{stats?.failedCount || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Success Rate (24h)</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-500">{stats?.successRate || 0}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhook Subscriptions
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => initWebhooksMutation.mutate()}
              disabled={initWebhooksMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${initWebhooksMutation.isPending ? 'animate-spin' : ''}`} />
              Init
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500">{webhookData?.total || 0}</Badge>
              </div>
              {webhookData?.byChain && Object.entries(webhookData.byChain).map(([chain, count]) => (
                <div key={chain} className="flex justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{chain}</span>
                  <span className="text-sm font-mono">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
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
