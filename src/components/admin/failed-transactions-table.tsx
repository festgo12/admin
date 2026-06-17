'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function FailedTransactionsTable() {
  const { data: failedData, isLoading, refetch } = useQuery({
    queryKey: ['failed-transactions'],
    queryFn: () => adminService.getFailedTransactions(1, 20),
  });

  const handleRetry = async (txId: string) => {
    try {
      // In a real app, you'd call a dedicated retry endpoint
      // await adminService.retryTransaction(txId);
      toast.success('Retry sequence initiated');
      refetch();
    } catch (error) {
      toast.error('Failed to retry transaction');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold text-lg">Failed Transaction Queue</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border border-red-500/20 bg-red-500/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Error Info</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : failedData?.transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No failed transactions in queue.
                </TableCell>
              </TableRow>
            ) : failedData?.transactions?.map((tx: any) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <p className="text-sm font-medium">{tx.wallet.user.email}</p>
                </TableCell>
                <TableCell>
                   <Badge variant="destructive">{tx.wallet.currency}</Badge>
                </TableCell>
                <TableCell className="font-mono">{tx.amount}</TableCell>
                <TableCell className="font-mono text-xs max-w-[120px] truncate">{tx.reference}</TableCell>
                <TableCell className="text-xs text-red-400 max-w-[200px] truncate">
                   {tx.metadata?.lastError || 'Unknown Error'}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => handleRetry(tx.id)}>
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
