'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WalletDetailsDialogProps {
  walletId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function WalletDetailsDialog({ walletId, onOpenChange }: WalletDetailsDialogProps) {
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['admin-wallet-detail', walletId],
    queryFn: () => adminService.getWalletDetail(walletId!),
    enabled: !!walletId,
  });

  return (
    <Dialog open={!!walletId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Wallet Audit Log</DialogTitle>
          <DialogDescription>
            Audit history for {wallet?.user?.email} ({wallet?.currency})
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center animate-pulse bg-muted rounded-md" />
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">{wallet?.balance.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-2xl font-bold">{wallet?.reservedBalance.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-xs font-mono truncate">{wallet?.address || 'N/A'}</p>
              </div>
            </div>

            <h3 className="font-bold text-lg">Transaction History</h3>
            <ScrollArea className="flex-1 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallet?.ledgerEntries?.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">
                        {new Date(entry.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.type === 'CREDIT' ? 'default' : 'destructive'} className="text-[10px]">
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={entry.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}>
                        {entry.type === 'CREDIT' ? '+' : '-'}{entry.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {entry.balanceAfter.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {entry.reference}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
