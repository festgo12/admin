'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService, AdminWallet } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Eye } from 'lucide-react';
import { WalletDetailsDialog } from './wallet-details-dialog';

export function WalletsTable() {
  const [search, setSearch] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const { data: walletsData, isLoading } = useQuery({
    queryKey: ['admin-wallets', search],
    queryFn: () => adminService.getWallets(1, 40, search),
  });

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
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wallets by email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {walletsData?.wallets?.map((wallet: AdminWallet) => (
              <TableRow key={wallet.id}>
                <TableCell>
                  <p className="font-medium">{wallet.user.profile.firstName} {wallet.user.profile.lastName}</p>
                  <p className="text-xs text-muted-foreground">{wallet.user.email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{wallet.currency}</Badge>
                </TableCell>
                <TableCell className="font-mono">
                  {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {wallet.reservedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(wallet.updatedAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedWalletId(wallet.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <WalletDetailsDialog
        walletId={selectedWalletId}
        onOpenChange={(open) => !open && setSelectedWalletId(null)}
      />
    </div>
  );
}
