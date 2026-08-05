'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RefreshCw, Send, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface FeeWallet {
  id: string;
  currency: string;
  address: string | null;
  balance: number;
  reservedBalance: number;
  available: number;
  ledgerEntryCount: number;
  updatedAt: string;
}

interface ApiError {
  response?: { data?: { message?: string } };
}

export function PlatformFeeWallets() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['platform-fee-wallets'],
    queryFn: adminService.getFeeWallets,
    refetchInterval: 15000,
  });

  const initMutation = useMutation({
    mutationFn: adminService.initFeeWallets,
    onSuccess: () => {
      toast.success('Platform fee wallets initialized');
      queryClient.invalidateQueries({ queryKey: ['platform-fee-wallets'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Failed to initialize platform wallets');
    },
  });

  const wallets: FeeWallet[] = data?.wallets || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-medium">Platform Fee Wallets</CardTitle>
            <CardDescription>
              Ledger homes for platform fee revenue. Use init to create or assign addresses.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => initMutation.mutate()}
            disabled={initMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${initMutation.isPending ? 'animate-spin' : ''}`} />
            Init Wallets
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 w-full animate-pulse bg-muted rounded-md" />
          ) : wallets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No platform wallets yet. Click &quot;Init Wallets&quot; to create them.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Ledger Entries</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((w) => (
                  <FeeWalletRow key={w.currency} wallet={w} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FeeWalletRow({ wallet }: { wallet: FeeWallet }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [sweepOpen, setSweepOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');

  const isCrypto = wallet.currency !== 'NGN';

  const sweepMutation = useMutation({
    mutationFn: () =>
      adminService.sweepFeeWallet(
        wallet.currency,
        destination.trim(),
        amount ? parseFloat(amount) : undefined,
      ),
    onSuccess: (result: { txId: string }) => {
      toast.success(`Sweep submitted: ${result.txId}`);
      setSweepOpen(false);
      setDestination('');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['platform-fee-wallets'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Sweep failed');
    },
  });

  const copyAddress = async () => {
    if (!wallet.address) return;
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <Badge variant="outline">{wallet.currency}</Badge>
        </TableCell>
        <TableCell>
          {wallet.address ? (
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono max-w-[260px] truncate">
                {wallet.address}
              </code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="sr-only">Copy address</span>
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              {isCrypto ? 'No address — run Init' : 'Ledger-held'}
            </span>
          )}
        </TableCell>
        <TableCell className="font-mono">{wallet.balance.toLocaleString()}</TableCell>
        <TableCell className="font-mono">{wallet.reservedBalance.toLocaleString()}</TableCell>
        <TableCell className="font-mono">{wallet.available.toLocaleString()}</TableCell>
        <TableCell>{wallet.ledgerEntryCount}</TableCell>
        <TableCell className="text-right">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSweepOpen(true)}
            disabled={!isCrypto || sweepMutation.isPending}
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            Sweep
          </Button>
        </TableCell>
      </TableRow>

      <Dialog open={sweepOpen} onOpenChange={setSweepOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sweep {wallet.currency} fee wallet</DialogTitle>
            <DialogDescription>
              Transfer on-chain funds to a treasury address. The wallet&apos;s derived key signs the
              transaction, so the internal ledger stays in sync.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sweep-destination">Destination address</Label>
              <Input
                id="sweep-destination"
                placeholder={wallet.currency === 'BTC' ? 'bc1q... or 1...' : '0x...'}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sweep-amount">
                Amount <span className="text-muted-foreground">(optional — sweeps full balance)</span>
              </Label>
              <Input
                id="sweep-amount"
                type="number"
                step="any"
                min={0}
                placeholder="Full balance if empty"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => sweepMutation.mutate()}
              disabled={!destination.trim() || sweepMutation.isPending}
            >
              {sweepMutation.isPending ? 'Sweeping...' : 'Confirm Sweep'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
