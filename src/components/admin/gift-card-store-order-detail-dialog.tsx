'use client';

import { useQuery } from '@tanstack/react-query';
import {
  giftCardAdminService,
  StoreOrderAdmin,
} from '@/services/gift-card-admin-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Gift, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface GiftCardStoreOrderDetailDialogProps {
  orderId: string | null;
  onOpenChange: (open: boolean) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-500/20 text-green-500">Completed</Badge>;
    case 'PENDING':
      return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
    case 'FAILED':
      return <Badge className="bg-red-500/20 text-red-500">Failed</Badge>;
    case 'REFUNDED':
      return <Badge className="bg-orange-500/20 text-orange-500">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function toNum(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function copyText(text: string | null | undefined) {
  if (!text) return;
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
}

export function GiftCardStoreOrderDetailDialog({
  orderId,
  onOpenChange,
}: GiftCardStoreOrderDetailDialogProps) {
  const { data: order, isLoading } = useQuery<StoreOrderAdmin | null>({
    queryKey: ['admin-gift-card-store-order-detail', orderId],
    queryFn: () =>
      orderId ? giftCardAdminService.getStoreOrderDetail(orderId) : null,
    enabled: !!orderId,
  });

  return (
    <Dialog open={!!orderId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gift Card Store Order
          </DialogTitle>
          <DialogDescription>
            Order details including the delivered card code
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="w-full space-y-4 animate-pulse py-4">
            <div className="h-20 bg-muted rounded-md w-full" />
            <div className="h-32 bg-muted rounded-md w-full" />
          </div>
        ) : order ? (
          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-6 py-2">
              {/* Summary */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-lg">
                      {order.product?.productName || 'Gift Card'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.product?.brand?.brandName || 'Unknown brand'} ·{' '}
                      {order.denomination} {order.currencyCode} × {order.quantity}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order ID</p>
                    <p className="font-mono text-xs mt-1 break-all">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Provider Order ID</p>
                    <p className="font-mono text-xs mt-1 break-all">
                      {order.providerOrderId || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Paid</p>
                    <p className="mt-1 font-bold">₦{toNum(order.sellPriceNgn).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Platform Fee</p>
                    <p className="mt-1">₦{toNum(order.feeNgn).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Provider Cost</p>
                    <p className="mt-1">₦{toNum(order.costNgn).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {order.failureMessage && (
                  <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500">
                    {order.failureMessage}
                  </div>
                )}
              </div>

              {/* Card Code */}
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                <h4 className="font-medium mb-3 text-sm text-yellow-500 uppercase tracking-wide">
                  Delivered Card (Admin Only)
                </h4>
                {order.cardCode ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">Card Code</p>
                        <button
                          onClick={() => copyText(order.cardCode)}
                          className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      </div>
                      <p className="font-mono font-bold bg-black/40 rounded-md px-3 py-2 break-all">
                        {order.cardCode}
                      </p>
                    </div>
                    {order.cardPin && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Card PIN</p>
                        <p className="font-mono font-bold bg-black/40 rounded-md px-3 py-2 break-all">
                          {order.cardPin}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No card code delivered. {order.status === 'PENDING' ? 'The order is still processing.' : ''}
                  </p>
                )}
              </div>

              {/* Buyer */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                  Buyer
                </h4>
                <p className="text-sm font-medium">
                  {order.user.profile
                    ? `${order.user.profile.firstName || ''} ${order.user.profile.lastName || ''}`.trim()
                    : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">{order.user.email}</p>
                {order.recipientEmail && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Recipient: {order.recipientEmail}
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <p className="text-center text-muted-foreground py-8">Order not found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}