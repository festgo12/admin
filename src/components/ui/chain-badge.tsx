import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CHAIN_META, normalizeChain } from '@/lib/chain';

interface ChainBadgeProps {
  chain?: string | null;
  className?: string;
}

/** Displays a canonical chain badge, normalising the legacy 'EVM' value to ETH. */
export function ChainBadge({ chain, className }: ChainBadgeProps) {
  const normalized = normalizeChain(chain);
  if (!normalized) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <Badge variant="outline" className={cn(CHAIN_META[normalized].className, className)}>
      {normalized === 'ETH' && chain?.toUpperCase() === 'EVM' ? 'ETH*' : normalized}
    </Badge>
  );
}

interface ChainSelectProps {
  value?: string;
  onChange: (value: string) => void;
  allLabel?: string;
  chains?: readonly string[];
  className?: string;
  /** Accessible name for the native select (no visible label in tables). */
  ariaLabel?: string;
}

/** Native select styled to match Input, used for chain filtering. */
export function ChainSelect({
  value,
  onChange,
  allLabel = 'All chains',
  chains,
  className,
  ariaLabel = 'Filter by chain',
}: ChainSelectProps) {
  const options = chains ?? ['ETH', 'BSC', 'POLYGON', 'SOLANA', 'TRON', 'BTC'];
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 max-w-[160px]',
        className,
      )}
    >
      <option value="">{allLabel}</option>
      {options.map((chain) => (
        <option key={chain} value={chain}>
          {chain}
        </option>
      ))}
    </select>
  );
}