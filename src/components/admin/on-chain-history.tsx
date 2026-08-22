'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpRight, ArrowDownLeft, Search, Database } from 'lucide-react';
import { toast } from 'sonner';

export function OnChainHistory() {
  const [evmAddress, setEvmAddress] = useState('');
  const [evmAddressInput, setEvmAddressInput] = useState('');
  const [btcPage, setBtcPage] = useState(1);
  const [evmPage, setEvmPage] = useState(1);

  // BTC History
  const { data: btcData, isLoading: btcLoading } = useQuery({
    queryKey: ['btc-history', btcPage],
    queryFn: () => adminService.getBtcHistory(btcPage, 50),
  });

  // EVM History (only fetches when address is set)
  const { data: evmData, isLoading: evmLoading } = useQuery({
    queryKey: ['evm-history', evmAddress, evmPage],
    queryFn: () => adminService.getEvmHistory(evmAddress, evmPage),
    enabled: !!evmAddress,
  });

  const handleEvmSearch = () => {
    const addr = evmAddressInput.trim();
    if (!addr) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      toast.error('Invalid Ethereum address. Must be 0x followed by 40 hex characters.');
      return;
    }
    setEvmAddress(addr);
    setEvmPage(1);
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
                      <TableCell>
                        {tx.dbMatch ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500">Yes</Badge>
                        ) : (
                          <Badge variant="destructive">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.dbTransaction ? (
                          <Badge variant="outline">{tx.dbTransaction.status}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
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
              Enter an Ethereum address above to view on-chain transfer history.
            </p>
          ) : evmLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading EVM history for {evmAddress}…</p>
          ) : !evmData?.transfers?.length ? (
            <p className="text-sm text-muted-foreground py-4">No transfers found for this address.</p>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>TX Hash</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>In DB</TableHead>
                    <TableHead>DB Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evmData.transfers.map((tx: any) => (
                    <TableRow key={`${tx.hash}-${tx.blockNum}`}>
                      <TableCell>
                        <Badge variant="outline">{tx.asset}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] max-w-[120px] truncate">
                        {tx.hash}
                      </TableCell>
                      <TableCell className="font-mono">{tx.amount.toFixed(6)}</TableCell>
                      <TableCell className="text-xs capitalize">{tx.category}</TableCell>
                      <TableCell className="font-mono text-[10px] max-w-[80px] truncate">
                        {tx.from}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] max-w-[80px] truncate">
                        {tx.to}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{tx.blockNum}</TableCell>
                      <TableCell>
                        {tx.dbMatch ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500">Yes</Badge>
                        ) : (
                          <Badge variant="destructive">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.dbTransaction ? (
                          <Badge variant="outline">{tx.dbTransaction.status}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
