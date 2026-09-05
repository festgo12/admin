'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService, AdminOrder } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MoreHorizontal, Eye, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { ChainBadge, ChainSelect } from '@/components/ui/chain-badge';

export function OrdersTable() {
  const [search, setSearch] = useState('');
  const [chain, setChain] = useState('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', search, chain],
    queryFn: () => adminService.getOrders(1, 20, search, chain || undefined),
  });

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

  if (isLoading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded-md w-1/3" />
        <div className="h-[400px] bg-muted rounded-md w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders by ID or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ChainSelect value={chain} onChange={setChain} />
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersData?.orders?.map((order: AdminOrder) => (
              <TableRow key={order.id} className={order.fraudFlagged ? 'bg-destructive/5' : ''}>
                <TableCell className="font-mono text-xs max-w-[100px] truncate">
                  {order.id}
                </TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{order.buyer.profile.firstName} {order.buyer.profile.lastName}</p>
                  <p className="text-xs text-muted-foreground">{order.buyer.email}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{order.seller.profile.firstName} {order.seller.profile.lastName}</p>
                  <p className="text-xs text-muted-foreground">{order.seller.email}</p>
                </TableCell>
                <TableCell>
                  <ChainBadge chain={order.chain ?? order.ad?.chain} />
                </TableCell>
                <TableCell>
                  <p className="font-bold text-sm">₦{order.fiatAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{order.cryptoAmount} {order.ad.asset}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                  {order.fraudFlagged && (
                    <Badge variant="destructive" className="ml-1 px-1">
                      <AlertTriangle className="h-3 w-3" />
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
