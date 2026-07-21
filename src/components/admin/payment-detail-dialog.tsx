'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  paystackAdminService,
  PaymentTransactionDetail,
} from '@/services/paystack-admin-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowDownToLine, ArrowUpFromLine, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface PaymentDetailDialogProps {
  transactionId: string | null;
  onOpenChange: (open: boolean) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-500/20 text-green-500">Completed</Badge>;
    case 'PENDING':
      return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
    case 'PROCESSING':
      return <Badge className="bg-blue-500/20 text-blue-500">Processing</Badge>;
    case 'FAILED':
      return <Badge className="bg-red-500/20 text-red-500">Failed</Badge>;
    case 'REVERSED':
      return <Badge className="bg-purple-500/20 text-purple-500">Reversed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function PaymentDetailDialog({ transactionId, onOpenChange }: PaymentDetailDialogProps) {
  const queryClient = useQueryClient();
  const [refundAmount, setRefundAmount] = useState('');
  const [showRefundInput, setShowRefundInput] = useState(false);

  const { data: tx, isLoading } = useQuery<PaymentTransactionDetail | null>({
    queryKey: ['admin-payment-detail', transactionId],
    queryFn: () =>
      transactionId ? paystackAdminService.getTransactionDetail(transactionId) : null,
    enabled: !!transactionId,
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      paystackAdminService.initiateRefund(
        transactionId!,
        refundAmount ? parseFloat(refundAmount) : undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-detail', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payments-stats'] });
      toast.success('Refund initiated successfully');
      setShowRefundInput(false);
      setRefundAmount('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to initiate refund');
    },
  });

  const handleRefund = () => {
    if (refundAmount) {
      const amount = parseFloat(refundAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      if (tx && amount > Math.abs(Number(tx.amount))) {
        toast.error('Refund amount cannot exceed transaction amount');
        return;
      }
    }
    refundMutation.mutate();
  };

  return (
    <Dialog open={!!transactionId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </DialogTitle>
          <DialogDescription>Full transaction information and ledger history</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="w-full space-y-4 animate-pulse py-4">
            <div className="h-20 bg-muted rounded-md w-full" />
            <div className="h-40 bg-muted rounded-md w-full" />
          </div>
        ) : tx ? (
          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-6 py-2">
              {/* Transaction Summary */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {tx.type === 'DEPOSIT' ? (
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <ArrowDownToLine className="h-5 w-5 text-green-500" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <ArrowUpFromLine className="h-5 w-5 text-blue-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">
                        {tx.type === 'DEPOSIT' ? '+' : '-'} ₦{Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">{tx.type} &middot; {tx.wallet.currency}</p>
                    </div>
                  </div>
                  {getStatusBadge(tx.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-xs mt-1">{tx.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reference</p>
                    <p className="font-mono text-xs mt-1">{tx.reference}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fee</p>
                    <p className="mt-1">₦{Number(tx.fee || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">User</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="mt-1 font-medium">
                      {tx.wallet.user.profile?.firstName} {tx.wallet.user.profile?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="mt-1">{tx.wallet.user.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Wallet Balance</p>
                    <p className="mt-1">₦{Number(tx.wallet.balance).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Wallet ID</p>
                    <p className="font-mono text-xs mt-1">{tx.wallet.id}</p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {tx.metadata && Object.keys(tx.metadata).length > 0 && (
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Metadata</h4>
                  <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto">
                    {JSON.stringify(tx.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Ledger Entries */}
              {tx.ledgerEntries.length > 0 && (
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Ledger Entries</h4>
                  <div className="space-y-2">
                    {tx.ledgerEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {Number(entry.amount) >= 0 ? '+' : ''}₦{Number(entry.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.type} &middot; {entry.reference}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Balance: ₦{Number(entry.balanceAfter).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Refund Section */}
              {tx.status === 'COMPLETED' && tx.type === 'DEPOSIT' && (
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Refund</h4>
                  {showRefundInput ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder={`Full amount (₦${Math.abs(tx.amount).toLocaleString()})`}
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRefund}
                          disabled={refundMutation.isPending}
                        >
                          {refundMutation.isPending ? 'Processing...' : 'Confirm Refund'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowRefundInput(false);
                            setRefundAmount('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave amount empty for full refund. Partial refund is also supported.
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowRefundInput(true)}
                    >
                      <RotateCcw className="h-4 w-4" /> Initiate Refund
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-center text-muted-foreground py-8">Transaction not found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
