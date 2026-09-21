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
import { RefreshCw, Send, Copy, Check, ArrowUpRight, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { ChainBadge } from '@/components/ui/chain-badge';
import type { SweepConfigItem, SweepSummary } from '@/services/admin-service';

interface FeeWallet {
  id: string;
  currency: string;
  chain?: string | null;
  address: string | null;
  balance: number;
  reservedBalance: number;
  available: number;
  ledgerEntryCount: number;
  updatedAt: string;
}

interface ChainBalanceEntry {
  chain?: string;
  currency: string;
  address: string;
  balance: number;
  error?: string;
}

interface SweepAllResult {
  success?: boolean;
  message?: string;
  swept?: number;
  summary?: SweepSummary;
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

  const { data: chainData, isLoading: chainsLoading } = useQuery({
    queryKey: ['chain-balances'],
    queryFn: adminService.getChainBalances,
    refetchInterval: 30000,
  });

  const { data: sweepConfig, isLoading: sweepConfigLoading } = useQuery({
    queryKey: ['sweep-config'],
    queryFn: adminService.getSweepConfig,
    refetchInterval: 30000,
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

  const sweepAllMutation = useMutation({
    mutationFn: adminService.sweepAll,
    onSuccess: (result: SweepAllResult) => {
      const summary = result.summary;
      const totalSwept =
        (summary?.evmSwept ?? 0) +
        (summary?.btcSwept ?? 0) +
        (summary?.solSwept ?? 0) +
        (summary?.tronSwept ?? 0);
      if (summary && totalSwept > 0) {
        toast.success(
          `Swept ${summary.evmSwept ?? 0} EVM + ${summary.btcSwept ?? 0} BTC + ${summary.solSwept ?? 0} SOL + ${summary.tronSwept ?? 0} TRON address(es) into the platform wallet`,
        );
      } else if (result.message) {
        toast.success(result.message);
      } else {
        toast.success('Sweep completed — no qualifying addresses');
      }
      if (summary?.errors?.length) {
        toast.error(`${summary.errors.length} address(es) failed to sweep`);
      }
      queryClient.invalidateQueries({ queryKey: ['platform-fee-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['chain-balances'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Sweep all failed');
    },
  });

  const wallets: FeeWallet[] = data?.wallets || [];
  const masterWallets = chainData?.masterWallets;
  const chainBalances: ChainBalanceEntry[] = chainData?.balances || [];

  return (
    <div className="space-y-6">
      {/* On-chain treasury (master wallet) balances */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-medium">Treasury — Master Wallets (on-chain)</CardTitle>
            <CardDescription>
              Live confirmed balances of the platform HD master wallets. Fee wallets are swept here.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {chainsLoading ? (
            <div className="h-24 w-full animate-pulse bg-muted rounded-md" />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {chainBalances.map((b, i) => (
                  <div
                    key={`${b.chain ?? ''}-${b.currency}-${i}`}
                    className="rounded-md border border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <ChainBadge chain={b.chain} />
                        <Badge variant="outline">{b.currency}</Badge>
                      </div>
                      <span className="text-lg font-bold font-mono">
                        {b.balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </span>
                    </div>
                    {b.error ? (
                      <p className="mt-2 text-[10px] text-red-500 truncate">Error: {b.error}</p>
                    ) : (
                      <code className="mt-2 block text-[10px] font-mono text-muted-foreground truncate">
                        {b.address}
                      </code>
                    )}
                  </div>
                ))}
              </div>
              {masterWallets && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {[
                    { label: 'EVM master', value: masterWallets.evm },
                    { label: 'BTC master', value: masterWallets.btc },
                    { label: 'SOL master', value: masterWallets.sol },
                    { label: 'TRON master', value: masterWallets.tron },
                  ]
                    .filter((w) => w.value)
                    .map((w) => (
                      <p key={w.label}>
                        <span className="font-medium text-foreground">{w.label}:</span>{' '}
                        <code className="font-mono">{w.value}</code>
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-chain sweep controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Deposit Sweep Controls
            </CardTitle>
            <CardDescription>
              Enable, disable or trigger a sweep per chain. Thresholds are in USD — 0 / global
              disables sweeping when set on the server. A global threshold of {sweepConfig?.globalThresholdUsd ?? 0} USD applies
              to chains without an override.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {sweepConfigLoading ? (
            <div className="h-24 w-full animate-pulse bg-muted rounded-md" />
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sweepConfig?.chains?.map((item: SweepConfigItem) => (
                    <SweepConfigRow
                      key={item.chain}
                      item={item}
                      globalThresholdUsd={sweepConfig.globalThresholdUsd}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-medium">Platform Fee Wallets</CardTitle>
            <CardDescription>
              Ledger homes for platform fee revenue. Use init to create or assign addresses.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sweepAllMutation.mutate()}
              disabled={sweepAllMutation.isPending}
              title="Consolidate all deposit addresses above the threshold into the platform wallet"
            >
              <ArrowUpRight className={`h-4 w-4 mr-1 ${sweepAllMutation.isPending ? 'animate-pulse' : ''}`} />
              {sweepAllMutation.isPending ? 'Sweeping...' : 'Sweep All to Platform'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => initMutation.mutate()}
              disabled={initMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${initMutation.isPending ? 'animate-spin' : ''}`} />
              Init Wallets
            </Button>
          </div>
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
                  <FeeWalletRow key={w.id} wallet={w} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface SweepConfigRowProps {
  item: SweepConfigItem;
  globalThresholdUsd: number;
}

function SweepConfigRow({ item, globalThresholdUsd }: SweepConfigRowProps) {
  const queryClient = useQueryClient();
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(
    item.thresholdUsd != null ? String(item.thresholdUsd) : '',
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sweep-config'] });
    queryClient.invalidateQueries({ queryKey: ['chain-balances'] });
    queryClient.invalidateQueries({ queryKey: ['platform-fee-wallets'] });
  };

  const sweepMutation = useMutation({
    mutationFn: () => adminService.sweepChain(item.chain),
    onSuccess: (summary: SweepSummary) => {
      const swept = summary.sweptByChain?.[item.chain] ?? 0;
      const skipped = summary.skippedByChain?.[item.chain] ?? 0;
      if (summary.errors?.length) {
        toast.error(`${summary.errors.length} address(es) failed to sweep on ${item.chain}`);
      } else if (swept > 0) {
        toast.success(`Swept ${swept} ${item.chain} address(es) into the platform wallet`);
      } else if (skipped > 0) {
        toast.info(`Sweep of ${item.chain}: only master address(es) skipped`);
      } else {
        toast.success(`Sweep of ${item.chain} completed — no qualifying addresses`);
      }
      invalidate();
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || `Sweep of ${item.chain} failed`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: () => adminService.updateSweepConfig(item.chain, { enabled: !item.enabled }),
    onSuccess: () => {
      toast.success(`${item.chain} sweeping ${item.enabled ? 'disabled' : 'enabled'}`);
      invalidate();
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Failed to update sweep config');
    },
  });

  const thresholdMutation = useMutation({
    mutationFn: () => {
      const trimmed = thresholdInput.trim();
      if (!trimmed) return adminService.updateSweepConfig(item.chain, { thresholdUsd: null });
      const parsed = parseFloat(trimmed);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return adminService.updateSweepConfig(item.chain, { thresholdUsd: null });
      }
      return adminService.updateSweepConfig(item.chain, { thresholdUsd: parsed });
    },
    onSuccess: () => {
      toast.success(`${item.chain} sweep threshold updated`);
      setEditingThreshold(false);
      invalidate();
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Failed to update threshold');
    },
  });

  const activeSweeping =
    sweepMutation.isPending || toggleMutation.isPending || thresholdMutation.isPending;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <ChainBadge chain={item.chain} />
          <span className="text-xs text-muted-foreground">{item.chain}</span>
        </div>
      </TableCell>
      <TableCell>
        {item.enabled ? (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Enabled</Badge>
        ) : (
          <Badge variant="destructive">Disabled</Badge>
        )}
      </TableCell>
      <TableCell>
        {editingThreshold ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              step="any"
              min={0}
              className="h-8 w-28"
              placeholder="USD"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              disabled={thresholdMutation.isPending}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => thresholdMutation.mutate()}
              disabled={thresholdMutation.isPending}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => {
                setEditingThreshold(false);
                setThresholdInput(item.thresholdUsd?.toString() ?? '');
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {item.usesGlobalThreshold || item.thresholdUsd == null ? (
              <span className="text-xs text-muted-foreground">
                Global ({globalThresholdUsd} USD)
              </span>
            ) : (
              <span className="text-xs font-mono">{item.thresholdUsd} USD</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setThresholdInput(item.thresholdUsd?.toString() ?? '');
                setEditingThreshold(true);
              }}
            >
              Override
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant={item.enabled ? 'outline' : 'default'}
            size="sm"
            onClick={() => toggleMutation.mutate()}
            disabled={activeSweeping}
          >
            {item.enabled ? 'Disable' : 'Enable'}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => sweepMutation.mutate()}
            disabled={activeSweeping}
            title={`Sweep all qualifying ${item.chain} deposit addresses into the platform wallet`}
          >
            <ArrowUpRight className={`h-4 w-4 mr-1 ${sweepMutation.isPending ? 'animate-pulse' : ''}`} />
            {sweepMutation.isPending ? 'Sweeping...' : 'Sweep'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
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
          <div className="flex items-center gap-1.5">
            <Badge variant="outline">{wallet.currency}</Badge>
            {wallet.chain ? <ChainBadge chain={wallet.chain} /> : null}
          </div>
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
