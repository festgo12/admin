'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Droplet } from 'lucide-react';
import { toast } from 'sonner';

const FAUCET_CURRENCIES = ['BTC', 'ETH', 'USDT', 'USDC'];

interface ApiError {
  response?: { data?: { message?: string } };
}

export function TestnetFaucet() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');

  const { data: cryptoStatus } = useQuery({
    queryKey: ['crypto-system-status'],
    queryFn: adminService.getCryptoSystemStatus,
    refetchInterval: 30000,
  });

  const isTestnet = cryptoStatus?.isTestnet ?? false;

  const creditMutation = useMutation({
    mutationFn: () =>
      adminService.creditTestFunds(email.trim(), currency, parseFloat(amount)),
    onSuccess: (result) => {
      toast.success(`Credited ${amount} ${currency} (ref: ${result.reference})`);
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['crypto-system-status'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Testnet credit failed');
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Droplet className="h-4 w-4 text-blue-500" />
            Testnet Faucet
          </CardTitle>
          <CardDescription>
            Credit a user&apos;s wallet with simulated funds. Only available when the
            platform is running against a testnet network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            {isTestnet ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                Testnet active ({cryptoStatus?.network})
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Mainnet — faucet disabled
              </Badge>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="faucet-email">User email</Label>
              <Input
                id="faucet-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faucet-currency">Currency</Label>
              <select
                id="faucet-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {FAUCET_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="faucet-amount">Amount</Label>
              <Input
                id="faucet-amount"
                type="number"
                step="any"
                min={0}
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="mt-4"
            onClick={() => creditMutation.mutate()}
            disabled={!isTestnet || !email.trim() || !amount || creditMutation.isPending}
          >
            {creditMutation.isPending ? 'Crediting...' : 'Credit Test Funds'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
