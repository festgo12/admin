'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Database,
  CloudDownload,
} from 'lucide-react';
import { toast } from 'sonner';
import { ChainBadge, ChainSelect } from '@/components/ui/chain-badge';
import type { EvmPullResult } from '@/services/admin-service';

const EVM_CHAIN_OPTIONS = ['ETH', 'BSC', 'POLYGON'];

const isEvmAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);
const isTronAddress = (value: string) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value);
const isSolAddress = (value: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);

interface ApiError {
  response?: { data?: { message?: string } };
}

export function OnChainHistory() {
  const [evmAddress, setEvmAddress] = useState('');
  const [evmAddressInput, setEvmAddressInput] = useState('');
  const [evmChain, setEvmChain] = useState('ETH');
  const [btcPage, setBtcPage] = useState(1);
  const [evmPage, setEvmPage] = useState(1);

  const [tronAddress, setTronAddress] = useState('');
  const [tronAddressInput, setTronAddressInput] = useState('');
  const [tronPage, setTronPage] = useState(1);

  const [solAddress, setSolAddress] = useState('');
  const [solAddressInput, setSolAddressInput] = useState('');
  const [solPage, setSolPage] = useState(1);

  // BTC History
  const { data: btcData, isLoading: btcLoading } = useQuery({
    queryKey: ['btc-history', btcPage],
    queryFn: () => adminService.getBtcHistory(btcPage, 50),
  });

  // EVM History (only fetches when address is set)
  const { data: evmData, isLoading: evmLoading } = useQuery({
    queryKey: ['evm-history', evmAddress, evmChain, evmPage],
    queryFn: () => adminService.getEvmHistory(evmAddress, evmPage, evmChain),
    enabled: !!evmAddress,
  });

  // TRON History
  const { data: tronData, isLoading: tronLoading } = useQuery({
    queryKey: ['tron-history', tronAddress, tronPage],
    queryFn: () => adminService.getTronHistory(tronAddress, tronPage),
    enabled: !!tronAddress,
  });

  // Solana History
  const { data: solData, isLoading: solLoading } = useQuery({
    queryKey: ['sol-history', solAddress, solPage],
    queryFn: () => adminService.getSolHistory(solAddress, solPage),
    enabled: !!solAddress,
  });

  const handleEvmSearch = () => {
    const addr = evmAddressInput.trim();
    if (!addr) return;
    if (!isEvmAddress(addr)) {
      toast.error('Invalid EVM address. Must be 0x followed by 40 hex characters.');
      return;
    }
    setEvmAddress(addr);
    setEvmPage(1);
  };

  const handleTronSearch = () => {
    const addr = tronAddressInput.trim();
    if (!addr) return;
    if (!isTronAddress(addr)) {
      toast.error('Invalid Tron address. Must start with T and contain 34 base58 characters.');
      return;
    }
    setTronAddress(addr);
    setTronPage(1);
  };

  const handleSolSearch = () => {
    const addr = solAddressInput.trim();
    if (!addr) return;
    if (!isSolAddress(addr)) {
      toast.error('Invalid Solana address. Must be a base58 string of 32-44 characters.');
      return;
    }
    setSolAddress(addr);
    setSolPage(1);
  };

  return (
    <div className="space-y-6">
      {/* BTC Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            BTC On-Chain History (xpub)
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Page {btcData?.page || 1} of {btcData?.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBtcPage(Math.max(1, btcPage - 1))}
              disabled={btcPage <= 1}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBtcPage(btcPage + 1)}
              disabled={btcPage >= (btcData?.totalPages || 1)}
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {btcLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading BTC history…</p>
          ) : !btcData?.transactions?.length ? (
            <p className="text-sm text-muted-foreground py-4">No BTC transactions found.</p>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction</TableHead>
                    <TableHead>TX ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Confirmations</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>In DB</TableHead>
                    <TableHead>DB Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {btcData.transactions.map((tx: any) => (
                    <TableRow key={tx.txid}>
                      <TableCell>
                        {tx.direction === 'INBOUND' ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-blue-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] max-w-[120px] truncate">
                        {tx.txid}
                      </TableCell>
                      <TableCell className="font-mono">{tx.amount.toFixed(8)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.confirmations}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{tx.blockHeight}</TableCell>
                      <DbMatchCell dbMatch={tx.dbMatch} />
                      <DbStatusCell dbTransaction={tx.dbTransaction} />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EVM Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            EVM On-Chain History
            {evmAddress && <ChainBadge chain={evmChain} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="0x... enter specific address"
              value={evmAddressInput}
              onChange={(e) => setEvmAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEvmSearch()}
              className="flex-1"
            />
            <ChainSelect
              value={evmChain}
              onChange={(c) => {
                setEvmChain(c);
                setEvmPage(1);
                if (evmAddress) setEvmAddress(evmAddress);
              }}
              allLabel="Chain"
              chains={EVM_CHAIN_OPTIONS}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleEvmSearch}
              disabled={!evmAddressInput.trim()}
            >
              <Search className="h-4 w-4 mr-1" />
              Fetch
            </Button>
          </div>

          {!evmAddress ? (
            <p className="text-sm text-muted-foreground py-4">
              Enter an EVM address above to view on-chain transfer history.
            </p>
          ) : evmLoading ? (
            <p className="text-sm text-muted-foreground py-4">
              Loading {evmChain} history for {evmAddress}…
            </p>
          ) : !evmData?.transfers?.length ? (
            <p className="text-sm text-muted-foreground py-4">No transfers found for this address.</p>
          ) : (
            <>
              <TransferTable transfers={evmData.transfers} showCategory />
              <EvmPullButton chain={evmChain} address={evmAddressInput.trim() || evmAddress} />
            </>
          )}
        </CardContent>
      </Card>

      {/* TRON Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            TRON On-Chain History
            {tronAddress && <ChainBadge chain="TRON" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="T... enter TRON address (TRC-20 USDT/USDC)"
              value={tronAddressInput}
              onChange={(e) => setTronAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTronSearch()}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleTronSearch}
              disabled={!tronAddressInput.trim()}
            >
              <Search className="h-4 w-4 mr-1" />
              Fetch
            </Button>
          </div>

          {!tronAddress ? (
            <p className="text-sm text-muted-foreground py-4">
              Enter a TRON address above to view its TRC-20 USDT/USDC history.
            </p>
          ) : tronLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading TRON history…</p>
          ) : !tronData?.transfers?.length ? (
            <p className="text-sm text-muted-foreground py-4">No transfers found for this address.</p>
          ) : (
            <TransferTable transfers={tronData.transfers} />
          )}
        </CardContent>
      </Card>

      {/* Solana Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Solana On-Chain History
            {solAddress && <ChainBadge chain="SOLANA" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Solana address (SPL USDT/USDC)"
              value={solAddressInput}
              onChange={(e) => setSolAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSolSearch()}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSolSearch}
              disabled={!solAddressInput.trim()}
            >
              <Search className="h-4 w-4 mr-1" />
              Fetch
            </Button>
          </div>

          {!solAddress ? (
            <p className="text-sm text-muted-foreground py-4">
              Enter a Solana address above to view its SPL USDT/USDC history.
            </p>
          ) : solLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading Solana history…</p>
          ) : !solData?.transfers?.length ? (
            <p className="text-sm text-muted-foreground py-4">No transfers found for this address.</p>
          ) : (
            <TransferTable transfers={solData.transfers} showConfirmed />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DbMatchCell({ dbMatch }: { dbMatch?: boolean }) {
  return dbMatch ? (
    <TableCell>
      <Badge variant="outline" className="bg-green-500/10 text-green-500">Yes</Badge>
    </TableCell>
  ) : (
    <TableCell>
      <Badge variant="destructive">No</Badge>
    </TableCell>
  );
}

function DbStatusCell({ dbTransaction }: { dbTransaction?: any }) {
  return (
    <TableCell>
      {dbTransaction ? (
        <Badge variant="outline">{dbTransaction.status}</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )}
    </TableCell>
  );
}

interface TransferTableProps {
  transfers: any[];
  showCategory?: boolean;
  showConfirmed?: boolean;
}

function TransferTable({ transfers, showCategory, showConfirmed }: TransferTableProps) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>TX Hash</TableHead>
            <TableHead>Amount</TableHead>
            {showCategory && <TableHead>Category</TableHead>}
            {showConfirmed && <TableHead>Confirmed</TableHead>}
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Block</TableHead>
            <TableHead>In DB</TableHead>
            <TableHead>DB Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((tx: any) => (
            <TableRow key={`${tx.hash}-${tx.blockNum ?? tx.blockNumber ?? ''}`}>
              <TableCell>
                <Badge variant="outline">{tx.asset ?? tx.currency}</Badge>
              </TableCell>
              <TableCell className="font-mono text-[10px] max-w-[120px] truncate">
                {tx.hash}
              </TableCell>
              <TableCell className="font-mono">
                {typeof tx.amount === 'number' ? tx.amount.toLocaleString(undefined, { maximumFractionDigits: 8 }) : tx.amount}
              </TableCell>
              {showCategory && <TableCell className="text-xs capitalize">{tx.category}</TableCell>}
              {showConfirmed && (
                <TableCell>
                  {tx.confirmed ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">Yes</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </TableCell>
              )}
              <TableCell className="font-mono text-[10px] max-w-[80px] truncate">
                {tx.from}
              </TableCell>
              <TableCell className="font-mono text-[10px] max-w-[80px] truncate">
                {tx.to}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {tx.blockNum ?? tx.blockNumber}
              </TableCell>
              <DbMatchCell dbMatch={tx.dbMatch} />
              <DbStatusCell dbTransaction={tx.dbTransaction} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EvmPullButton({ chain, address }: { chain: string; address: string }) {
  const queryClient = useQueryClient();

  const pullMutation = useMutation({
    mutationFn: () => adminService.evmPull(chain, address),
    onSuccess: (result: EvmPullResult) => {
      if (result.credited > 0 || result.alreadyRecorded > 0) {
        toast.success(
          `${result.chain}: ${result.credited} deposit(s) credited, ${result.alreadyRecorded} already recorded`,
        );
      } else {
        toast.info(`${result.chain}: no new deposits found for this address`);
      }
      if (result.skipped?.length) {
        toast.error(`${result.skipped.length} transfer(s) skipped — ${result.skipped[0].slice(0, 80)}`);
      }
      if (result.errors?.length) {
        toast.error(`${result.errors.length} error(s) — ${result.errors[0].slice(0, 80)}`);
      }
      queryClient.invalidateQueries({ queryKey: ['evm-history'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Deposit pull failed');
    },
  });

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => pullMutation.mutate()}
        disabled={pullMutation.isPending}
        title="Scan the address for on-chain deposits missing from the DB and credit them"
      >
        <CloudDownload className={`h-4 w-4 mr-1 ${pullMutation.isPending ? 'animate-bounce' : ''}`} />
        {pullMutation.isPending ? 'Pulling deposits...' : 'Pull / credit missed deposits'}
      </Button>
    </div>
  );
}