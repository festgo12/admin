'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ArrowRight, User, Wallet, History, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => adminService.getOrderDetail(id),
  });

  if (isLoading) {
    return <div className="p-8 animate-pulse space-y-8">
      <div className="h-8 bg-muted w-1/4 rounded " />
      <div className="grid grid-cols-3 gap-8">
        <div className="h-64 bg-muted rounded col-span-2" />
        <div className="h-64 bg-muted rounded" />
      </div>
    </div>;
  }

  if (!order) {
    return <div className="p-8 text-center">Order not found</div>;
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default';
      case 'PENDING_SELLER': return 'secondary';
      case 'DECLINED':
      case 'EXPIRED':
      case 'CANCELLED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-outfit font-bold tracking-tight flex items-center gap-3">
            Order Details
            <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
            {order.fraudFlagged && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Fraud Flagged
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">{order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Trade Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Trade Overview</CardTitle>
            <CardDescription>Financial details and trade assets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-around p-6 bg-muted/30 rounded-xl border border-border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-bold">USER PAYING</p>
                <p className="text-2xl font-bold font-outfit">₦{order.fiatAmount.toLocaleString()}</p>
              </div>
              <ArrowRight className="h-8 w-8 text-muted-foreground opacity-30" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-bold">USER RECEIVING</p>
                <p className="text-2xl font-bold font-outfit text-primary">{order.cryptoAmount} {order.ad.asset}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <div>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Buyer Information
                </h4>
                <div className="space-y-2 p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm font-medium">{order.buyer.profile.firstName} {order.buyer.profile.lastName}</p>
                  <p className="text-xs text-muted-foreground">{order.buyer.email}</p>
                  <Button variant="link" className="p-0 h-auto text-xs" asChild>
                    <Link href={`/admin/users/${order.buyerId}`}>View Buyer Profile</Link>
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Seller Information
                </h4>
                <div className="space-y-2 p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm font-medium">{order.seller.profile.firstName} {order.seller.profile.lastName}</p>
                  <p className="text-xs text-muted-foreground">{order.seller.email}</p>
                  <Button variant="link" className="p-0 h-auto text-xs" asChild>
                    <Link href={`/admin/users/${order.sellerId}`}>View Seller Profile</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Update:</span>
                <span>{new Date(order.updatedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee:</span>
                <span className="font-bold text-primary">{order.feeAmount} {order.ad.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ad ID:</span>
                <span className="font-mono text-xs max-w-[120px] truncate">{order.adId}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full text-xs" disabled>
                Flag for Review
              </Button>
              <Button variant="outline" className="w-full text-xs text-destructive hover:bg-destructive/10" disabled>
                Force Release (Caution)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log / Ledger Entries */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Financial Audit Trail</CardTitle>
              <CardDescription>Ledger entries associated with this trade</CardDescription>
            </div>
            <History className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.ledgerEntries?.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-3 w-3" />
                        <span className="text-xs">{entry.wallet.currency} ({entry.wallet.userId.slice(0, 6)}...)</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[10px]">{entry.reference}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{entry.type}</Badge>
                    </TableCell>
                    <TableCell className={`font-bold ${entry.amount < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {entry.amount < 0 ? '-' : '+'}{Math.abs(entry.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
