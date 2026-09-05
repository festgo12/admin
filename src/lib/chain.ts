export type Chain = 'ETH' | 'BSC' | 'POLYGON' | 'SOLANA' | 'TRON' | 'BTC';

export const CHAINS: Chain[] = [
  'ETH',
  'BSC',
  'POLYGON',
  'SOLANA',
  'TRON',
  'BTC',
];

export const EVM_CHAINS: Chain[] = ['ETH', 'BSC', 'POLYGON'];

export const CHAIN_META: Record<Chain, { label: string; className: string }> = {
  ETH: {
    label: 'Ethereum',
    className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-transparent',
  },
  BSC: {
    label: 'BNB Smart Chain',
    className: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-transparent',
  },
  POLYGON: {
    label: 'Polygon',
    className: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-transparent',
  },
  SOLANA: {
    label: 'Solana',
    className: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-transparent',
  },
  TRON: {
    label: 'Tron',
    className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-transparent',
  },
  BTC: {
    label: 'Bitcoin',
    className: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-transparent',
  },
};

/** Maps the legacy 'EVM' chain value to ETH; unknown chains become null. */
export function normalizeChain(chain?: string | null): Chain | null {
  if (!chain) return null;
  const c = chain.toUpperCase();
  if (c === 'EVM') return 'ETH';
  if ((CHAINS as string[]).includes(c)) return c as Chain;
  return null;
}

export function chainLabel(chain?: string | null): string {
  const c = normalizeChain(chain);
  if (!c) return '—';
  return CHAIN_META[c].label;
}

export function currencyForChain(chain: Chain): string[] {
  if (chain === 'BTC') return ['BTC'];
  if (chain === 'SOLANA' || chain === 'TRON') return ['USDT', 'USDC'];
  return ['ETH', 'USDT', 'USDC'];
}