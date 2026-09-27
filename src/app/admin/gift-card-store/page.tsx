'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  giftCardAdminService,
  StoreStats,
  StoreConfig,
  StoreProductAdmin,
  StoreOrderAdmin,
} from '@/services/gift-card-admin-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Gift, RefreshCcw, Search, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { GiftCardStoreOrderDetailDialog } from '@/components/admin/gift-card-store-order-detail-dialog';

const PAGE_SIZE = 10;

const DENOMINATION_TYPES = [
  { value: 'ALL', label: 'All' },
  { value: 'FIXED', label: 'Fixed' },
  { value: 'RANGE', label: 'Range' },
  { value: 'OPEN', label: 'Open' },
];

const STORE_ORDER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

type ApiError = { response?: { data?: { message?: string } } };

function localToastError(error: unknown, fallback: string) {
  const msg = (error as ApiError)?.response?.data?.message;
  toast.error(msg || fallback);
}

function toNum(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function money(value: number | string | null | undefined): string {
  return `₦${toNum(value).toLocaleString()}`;
}

function getProductStatusBadge(enabled: boolean) {
  return enabled ? (
    <Badge className="bg-green-500/20 text-green-500">Enabled</Badge>
  ) : (
    <Badge className="bg-gray-500/20 text-gray-500">Disabled</Badge>
  );
}

function getTypeBadge(type: string) {
  const label = type || '—';
  return <Badge variant="outline">{label}</Badge>;
}

function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-500/20 text-green-500">Completed</Badge>;
    case 'PENDING':
      return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
    case 'FAILED':
      return <Badge className="bg-red-500/20 text-red-500">Failed</Badge>;
    case 'REFUNDED':
      return <Badge className="bg-orange-500/20 text-orange-500">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getEnvBadge(config: StoreConfig | undefined) {
  if (!config?.configured) {
    return (
      <Badge className="bg-gray-500/20 text-gray-500">
        Giftbit · Not configured
      </Badge>
    );
  }
  return config.environment === 'production' ? (
    <Badge className="bg-green-500/20 text-green-500">Giftbit · Production</Badge>
  ) : (
    <Badge className="bg-yellow-500/20 text-yellow-500">Giftbit · Testbed</Badge>
  );
}

function toUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ProviderStatus({
  config,
  statusError,
}: {
  config: StoreConfig | undefined;
  statusError?: { message?: string } | null;
}) {
  if (statusError) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge className="bg-red-500/20 text-red-500">Giftbit · Status unavailable</Badge>
        <span className="text-muted-foreground">
          {statusError.message || 'Could not load provider configuration. Is the backend running and your session valid?'}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {getEnvBadge(config)}
      {config?.configured &&
        (config.fundsUsd ? (
          <span className="text-muted-foreground">
            Funds:{' '}
            <span className="text-green-500 font-medium">
              {toUsd(config.fundsUsd.available)} available
            </span>
            {' · '}
            <span className="text-yellow-500">{toUsd(config.fundsUsd.pending)} pending</span>
            {' · '}
            <span className="text-muted-foreground">{toUsd(config.fundsUsd.reserved)} reserved</span>
          </span>
        ) : (
          <span className="text-muted-foreground">
            Token configured but fund balance unavailable.
          </span>
        ))}
      {!config?.configured && (
        <span className="text-muted-foreground">
          Set{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">GIFTBIT_ENV</code> and the matching{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">GIFTBIT_*_API_TOKEN</code> to enable
          purchases.
        </span>
      )}
    </div>
  );
}

function ProductEditDialog({
  product,
  onOpenChange,
}: {
  product: StoreProductAdmin | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [enabled, setEnabled] = useState<boolean>(product?.enabled ?? true);
  const [markup, setMarkup] = useState<string>(product ? String(toNum(product.markupPercent)) : '5');
  const [name, setName] = useState<string>(product?.productName ?? '');
  const [countryCode, setCountryCode] = useState<string>(product?.countryCode ?? 'US');
  const [denominationType, setDenominationType] = useState<string>(product?.denominationType ?? 'FIXED');
  const [denominations, setDenominations] = useState<string>(
    product?.fixedDenominations?.length ? product.fixedDenominations.join(', ') : '',
  );
  const [minDenom, setMinDenom] = useState<string>(
    product?.minDenomination != null ? String(toNum(product.minDenomination)) : '',
  );
  const [maxDenom, setMaxDenom] = useState<string>(
    product?.maxDenomination != null ? String(toNum(product.maxDenomination)) : '',
  );
  const [senderFee, setSenderFee] = useState<string>(String(toNum(product?.senderFee)));

  const ngnPerUsd = product?.ngnPerUsd ?? 0;

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof giftCardAdminService.updateStoreProduct>[1]) =>
      giftCardAdminService.updateStoreProduct(product!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-stats'] });
      toast.success('Product updated');
      onOpenChange(false);
    },
    onError: (error: unknown) => localToastError(error, 'Failed to update product'),
  });

  const parsedDenominations = denominations
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  const handleSave = () => {
    const parsedMarkup = Number(markup);
    if (Number.isNaN(parsedMarkup) || parsedMarkup < 0 || parsedMarkup > 100) {
      toast.error('Markup must be between 0 and 100');
      return;
    }
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    const type = denominationType as 'FIXED' | 'RANGE' | 'OPEN';
    if (type === 'FIXED' && parsedDenominations.length === 0) {
      toast.error('Add at least one fixed denomination (comma-separated USD values)');
      return;
    }
    if (type === 'RANGE' && (!minDenom || Number(minDenom) <= 0)) {
      toast.error('A minimum denomination is required for range cards');
      return;
    }
    if (
      type === 'RANGE' &&
      minDenom &&
      maxDenom &&
      Number(maxDenom) <= Number(minDenom)
    ) {
      toast.error('Max denomination must be greater than min');
      return;
    }

    updateMutation.mutate({
      enabled,
      markupPercent: parsedMarkup,
      productName: name.trim(),
      countryCode: countryCode.trim().toUpperCase(),
      denominationType: type,
      ...(type === 'FIXED' && { fixedDenominations: parsedDenominations }),
      ...(type === 'RANGE' && minDenom && { minDenomination: Number(minDenom) }),
      ...(type === 'RANGE' && maxDenom && { maxDenomination: Number(maxDenom) }),
      senderFee: Number(senderFee) || 0,
    });
  };

  const previewUsd =
    denominationType === 'FIXED' && parsedDenominations.length > 0
      ? parsedDenominations[0]
      : minDenom
        ? Number(minDenom)
        : null;

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Store Product</DialogTitle>
          <DialogDescription>
            Update visibility, pricing, and denominations. Purchases are fulfilled by Giftbit
            using the brand code <code className="rounded bg-muted px-1 text-xs">{product?.providerProductId || '—'}</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{product?.brand?.brandName || 'Unknown brand'}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enabled</p>
              <p className="text-xs text-muted-foreground">Show in the customer store</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-green-600' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-name">Product name</label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-country">Country code</label>
              <Input
                id="edit-country"
                value={countryCode}
                maxLength={3}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-type">Card type</label>
              <select
                id="edit-type"
                value={denominationType}
                onChange={(e) => setDenominationType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="FIXED">Fixed denominations</option>
                <option value="RANGE">Any amount (range)</option>
                <option value="OPEN">Custom amount</option>
              </select>
            </div>
          </div>

          {denominationType === 'FIXED' && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-denoms">
                Fixed denominations (USD, comma-separated)
              </label>
              <Input
                id="edit-denoms"
                placeholder="10, 25, 50, 100"
                value={denominations}
                onChange={(e) => setDenominations(e.target.value)}
              />
            </div>
          )}

          {denominationType === 'RANGE' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit-min">Min (USD)</label>
                <Input id="edit-min" type="number" min={0} value={minDenom} onChange={(e) => setMinDenom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit-max">Max (USD)</label>
                <Input id="edit-max" type="number" min={0} value={maxDenom} onChange={(e) => setMaxDenom(e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-fee">Sender fee (USD)</label>
              <Input id="edit-fee" type="number" min={0} step="0.01" value={senderFee} onChange={(e) => setSenderFee(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-markup">Markup (%)</label>
              <Input id="edit-markup" type="number" min={0} max={100} value={markup} onChange={(e) => setMarkup(e.target.value)} />
            </div>
          </div>

          {previewUsd != null && ngnPerUsd > 0 && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <span className="text-muted-foreground">Price preview: </span>
              <span className="font-medium">${previewUsd}</span>
              <span className="text-muted-foreground"> ≈ </span>
              <span className="font-medium">₦{Math.round(previewUsd * ngnPerUsd).toLocaleString()}</span>
              <span className="text-xs text-muted-foreground"> (before markup)</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [providerProductId, setProviderProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [existingBrandId, setExistingBrandId] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [denominationType, setDenominationType] = useState('FIXED');
  const [denominations, setDenominations] = useState('');
  const [minDenom, setMinDenom] = useState('');
  const [maxDenom, setMaxDenom] = useState('');
  const [senderFee, setSenderFee] = useState('0');
  const [markup, setMarkup] = useState('5');

  const { data: existingBrands } = useQuery({
    queryKey: ['admin-gift-card-store-brands'],
    queryFn: () => giftCardAdminService.getStoreBrands(),
    enabled: open,
  });

  const createBrandMutation = useMutation({
    mutationFn: (data: { brandName: string }) =>
      giftCardAdminService.createStoreBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-brands'] });
      toast.success('Brand created — select it below');
    },
    onError: (error: unknown) => localToastError(error, 'Failed to create brand'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof giftCardAdminService.createStoreProduct>[0]) =>
      giftCardAdminService.createStoreProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-stats'] });
      toast.success('Product created (disabled — enable it from the table)');
      onOpenChange(false);
    },
    onError: (error: unknown) => localToastError(error, 'Failed to create product'),
  });

  const parsedDenominations = denominations
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  const handleCreate = () => {
    if (!providerProductId.trim()) {
      toast.error('Giftbit brand code is required — find it in the catalog table');
      return;
    }
    if (!productName.trim()) {
      toast.error('Product name is required');
      return;
    }
    const type = denominationType as 'FIXED' | 'RANGE' | 'OPEN';
    if (type === 'FIXED' && parsedDenominations.length === 0) {
      toast.error('Add at least one fixed denomination (comma-separated USD values)');
      return;
    }
    if (type === 'RANGE' && (!minDenom || Number(minDenom) <= 0)) {
      toast.error('A minimum denomination is required for range cards');
      return;
    }

    const finish = (brandId?: string) => {
      createMutation.mutate({
        providerProductId: providerProductId.trim(),
        productName: productName.trim(),
        ...(brandId && { brandId }),
        countryCode: countryCode.trim().toUpperCase() || 'US',
        currencyCode: 'USD',
        denominationType: type,
        ...(type === 'FIXED' && { fixedDenominations: parsedDenominations }),
        ...(type === 'RANGE' && minDenom && { minDenomination: Number(minDenom) }),
        ...(type === 'RANGE' && maxDenom && { maxDenomination: Number(maxDenom) }),
        senderFee: Number(senderFee) || 0,
        markupPercent: Number(markup) || 0,
      });
    };

    // Create the brand first when a new brand name is supplied.
    if (newBrandName.trim()) {
      createBrandMutation.mutate(
        { brandName: newBrandName.trim() },
        {
          onSuccess: (brand) => finish(brand.id),
        },
      );
    } else {
      finish(existingBrandId || undefined);
    }
  };

  const busy = createMutation.isPending || createBrandMutation.isPending;
  const previewUsd =
    denominationType === 'FIXED' && parsedDenominations.length > 0
      ? parsedDenominations[0]
      : minDenom
        ? Number(minDenom)
        : null;
  // Approximate NGN preview; the exact live rate is applied server-side on save.
  const ngnPerUsd = 1550;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Store Product</DialogTitle>
          <DialogDescription>
            The <strong>Giftbit brand code</strong> must match a real Giftbit brand (purchases are
            fulfilled by Giftbit). Copy it from an existing catalog row or your Giftbit dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="create-code">Giftbit brand code</label>
            <Input
              id="create-code"
              placeholder="e.g. AMAZON-US"
              value={providerProductId}
              onChange={(e) => setProviderProductId(e.target.value.toUpperCase())}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="create-name">Product name</label>
            <Input
              id="create-name"
              placeholder="e.g. Amazon Gift Card"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Brand</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={existingBrandId}
                onChange={(e) => setExistingBrandId(e.target.value)}
                disabled={!!newBrandName.trim()}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">No brand</option>
                {(existingBrands || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
              <Input
                placeholder="…or new brand name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
              />
            </div>
            {newBrandName.trim() && (
              <p className="text-xs text-muted-foreground">
                A new brand “{newBrandName.trim()}” will be created with this product.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="create-country">Country code</label>
              <Input
                id="create-country"
                value={countryCode}
                maxLength={3}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="create-type">Card type</label>
              <select
                id="create-type"
                value={denominationType}
                onChange={(e) => setDenominationType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="FIXED">Fixed denominations</option>
                <option value="RANGE">Any amount (range)</option>
                <option value="OPEN">Custom amount</option>
              </select>
            </div>
          </div>

          {denominationType === 'FIXED' && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="create-denoms">
                Fixed denominations (USD, comma-separated)
              </label>
              <Input
                id="create-denoms"
                placeholder="10, 25, 50, 100"
                value={denominations}
                onChange={(e) => setDenominations(e.target.value)}
              />
            </div>
          )}

          {denominationType === 'RANGE' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-min">Min (USD)</label>
                <Input id="create-min" type="number" min={0} value={minDenom} onChange={(e) => setMinDenom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-max">Max (USD)</label>
                <Input id="create-max" type="number" min={0} value={maxDenom} onChange={(e) => setMaxDenom(e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="create-fee">Sender fee (USD)</label>
              <Input id="create-fee" type="number" min={0} step="0.01" value={senderFee} onChange={(e) => setSenderFee(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="create-markup">Markup (%)</label>
              <Input id="create-markup" type="number" min={0} max={100} value={markup} onChange={(e) => setMarkup(e.target.value)} />
            </div>
          </div>

          {previewUsd != null && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Price preview: <span className="font-medium text-foreground">${previewUsd}</span> card value
              {' · '}
              <span className="font-medium text-foreground">
                ≈ ₦{Math.round(previewUsd * ngnPerUsd).toLocaleString()}
              </span>
              {' (indicative — the live rate is applied when saved)'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={busy}>
            {busy ? 'Creating…' : 'Create Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Pagination({
  meta,
  page,
  onPageChange,
}: {
  meta: { page: number; totalPages: number; total: number } | undefined;
  page: number;
  onPageChange: (page: number) => void;
}) {
  if (!meta) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-xs text-muted-foreground">
        {meta.total === 0
          ? 'No results'
          : `Showing ${(meta.page - 1) * PAGE_SIZE + 1}-${Math.min(meta.page * PAGE_SIZE, meta.total)} of ${meta.total}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm font-medium">
          Page {meta.page} of {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
          disabled={page === meta.totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function GiftCardStorePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('products');
  const [productSearch, setProductSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('ALL');
  const [productPage, setProductPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderPage, setOrderPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => giftCardAdminService.deleteStoreProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-stats'] });
      toast.success('Product deleted');
      setDeletingProductId(null);
    },
    onError: (error: unknown) => {
      localToastError(error, 'Failed to delete product');
      setDeletingProductId(null);
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<StoreStats>({
    queryKey: ['admin-gift-card-store-stats'],
    queryFn: () => giftCardAdminService.getStoreStats(),
  });

  const {
    data: storeConfig,
    isError: storeConfigError,
    error: storeConfigErrorObj,
  } = useQuery<StoreConfig>({
    queryKey: ['admin-gift-card-store-config'],
    queryFn: () => giftCardAdminService.getStoreConfig(),
    retry: 1,
  });

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['admin-gift-card-store-products', productPage, productTypeFilter, productSearch],
    queryFn: () =>
      giftCardAdminService.getStoreProducts(productPage, PAGE_SIZE, {
        ...(productTypeFilter !== 'ALL' && { denominationType: productTypeFilter }),
        ...(productSearch.trim() && { search: productSearch.trim() }),
      }),
  });

  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['admin-gift-card-store-orders', orderPage, orderStatusFilter, orderSearch],
    queryFn: () =>
      giftCardAdminService.getStoreOrders(orderPage, PAGE_SIZE, {
        ...(orderStatusFilter !== 'ALL' && { status: orderStatusFilter }),
        ...(orderSearch.trim() && { search: orderSearch.trim() }),
      }),
  });

  const syncMutation = useMutation({
    mutationFn: () => giftCardAdminService.syncStoreCatalog(),
    onSuccess: (data: { syncedProducts: number; syncedBrands: number }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-stats'] });
      toast.success(`Synced ${data.syncedProducts} products, ${data.syncedBrands} brands`);
    },
    onError: (error: unknown) => localToastError(error, 'Catalog sync failed'),
  });

  const products: StoreProductAdmin[] = productData?.data || [];
  const orders: StoreOrderAdmin[] = orderData?.data || [];
  const productMeta = productData?.meta;
  const orderMeta = orderData?.meta;
  const editingProduct = products.find((p) => p.id === editingProductId);

  const fullName = (profile: { firstName: string | null; lastName: string | null } | null | undefined) =>
    profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : 'N/A';

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Gift Card Store</h1>
          <p className="text-muted-foreground">
            Giftbit-powered catalog, product enablement, and orders.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
          <Button
            className="gap-2"
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCcw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing…' : 'Sync Catalog'}
          </Button>
        </div>
      </div>

      <ProviderStatus
        config={storeConfig}
        statusError={
          storeConfigError
            ? {
                message:
                  (storeConfigErrorObj as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ||
                  (storeConfigErrorObj instanceof Error
                    ? storeConfigErrorObj.message
                    : undefined),
              }
            : null
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Gift className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                stats?.totalProducts || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.enabledProducts || 0} enabled in store
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Gift className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                stats?.totalOrders || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingOrders || 0} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                stats?.completedOrders || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.failedOrders || 0} failed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume (30d)</CardTitle>
            <Gift className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              ) : (
                money(stats?.totalVolumeNgn)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Completed orders, last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Store Products</TabsTrigger>
          <TabsTrigger value="orders">Store Orders</TabsTrigger>
        </TabsList>

        {/* Products */}
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <CardTitle>Catalog</CardTitle>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-10"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setProductPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {DENOMINATION_TYPES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      setProductTypeFilter(s.value);
                      setProductPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                      productTypeFilter === s.value
                        ? 'bg-background text-foreground shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Denomination</TableHead>
                      <TableHead>Provider ₦</TableHead>
                      <TableHead>Markup</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 bg-muted rounded animate-pulse" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No products found. Run a catalog sync to import from Giftbit.
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium max-w-[260px] truncate">
                              {product.productName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {product.countryCode} · {product.currencyCode}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {product.brand?.logoUrl ? (
                                <img
                                  src={product.brand.logoUrl}
                                  alt={product.brand.brandName}
                                  className="h-5 w-5 rounded-sm object-contain"
                                />
                              ) : (
                                <span className="h-5 w-5 rounded-sm bg-muted" />
                              )}
                              <span>{product.brand?.brandName || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(product.denominationType)}</TableCell>
                          <TableCell className="text-sm">
                            {product.denominationType === 'FIXED'
                              ? (product.fixedDenominations || []).length > 0
                                ? `$${product.fixedDenominations.join(', $')}`
                                : '—'
                              : `${product.minDenomination ? `$${toNum(product.minDenomination)}` : '—'} – ${
                                product.maxDenomination ? `$${toNum(product.maxDenomination)}` : '∞'
                              }`}
                          </TableCell>
                          <TableCell className="font-bold">
                            {money(product.providerPriceNgn)}
                            {product.indicativePriceUsd != null && (
                              <div className="text-xs font-normal text-muted-foreground">
                                ${toNum(product.indicativePriceUsd)} card
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{toNum(product.markupPercent)}%</TableCell>
                          <TableCell>{getProductStatusBadge(product.enabled)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingProductId(product.id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-500"
                                disabled={deletingProductId === product.id}
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Delete "${product.productName}"? Products with orders cannot be deleted.`,
                                    )
                                  ) {
                                    setDeletingProductId(product.id);
                                    deleteMutation.mutate(product.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <Pagination meta={productMeta} page={productPage} onPageChange={setProductPage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <CardTitle>Orders</CardTitle>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user email or product..."
                    className="pl-10"
                    value={orderSearch}
                    onChange={(e) => {
                      setOrderSearch(e.target.value);
                      setOrderPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {STORE_ORDER_STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      setOrderStatusFilter(s.value);
                      setOrderPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                      orderStatusFilter === s.value
                        ? 'bg-background text-foreground shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Total ₦</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 bg-muted rounded animate-pulse" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No store orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <TableCell>
                            <div className="font-medium">{fullName(order.user?.profile)}</div>
                            <div className="text-xs text-muted-foreground">{order.user?.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[220px] truncate">
                              {order.product?.productName || '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.product?.brand?.brandName || ''}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">
                            {toNum(order.denomination)} {order.currencyCode}
                            {order.quantity > 1 ? ` × ${order.quantity}` : ''}
                          </TableCell>
                          <TableCell className="font-bold">
                            {money(order.sellPriceNgn)}
                          </TableCell>
                          <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <Pagination meta={orderMeta} page={orderPage} onPageChange={setOrderPage} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProductEditDialog
        key={editingProductId ?? 'none'}
        product={editingProduct}
        onOpenChange={(open) => {
          if (!open) setEditingProductId(null);
        }}
      />

      <ProductCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <GiftCardStoreOrderDetailDialog
        orderId={selectedOrderId}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderId(null);
        }}
      />
    </div>
  );
}