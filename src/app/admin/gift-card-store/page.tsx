'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  giftCardAdminService,
  StoreStats,
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
import { Gift, RefreshCcw, Search, Eye, Pencil } from 'lucide-react';
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

  const updateMutation = useMutation({
    mutationFn: (data: { enabled?: boolean; markupPercent?: number }) =>
      giftCardAdminService.updateStoreProduct(product!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-store-stats'] });
      toast.success('Product updated');
      onOpenChange(false);
    },
    onError: (error: unknown) => localToastError(error, 'Failed to update product'),
  });

  const handleSave = () => {
    const parsedMarkup = Number(markup);
    if (Number.isNaN(parsedMarkup) || parsedMarkup < 0 || parsedMarkup > 100) {
      toast.error('Markup must be between 0 and 100');
      return;
    }
    updateMutation.mutate({ enabled, markupPercent: parsedMarkup });
  };

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Store Product</DialogTitle>
          <DialogDescription>
            Toggle visibility and set the markup (%) on top of the provider&apos;s NGN cost.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="font-medium text-sm break-all">{product?.productName || 'Loading…'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {product?.brand?.brandName || 'Unknown brand'}
            </p>
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
            <label className="text-sm font-medium" htmlFor="markup">
              Markup (%)
            </label>
            <Input
              id="markup"
              type="number"
              min={0}
              max={100}
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
            />
          </div>
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

  const { data: stats, isLoading: statsLoading } = useQuery<StoreStats>({
    queryKey: ['admin-gift-card-store-stats'],
    queryFn: () => giftCardAdminService.getStoreStats(),
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
            Reloadly-powered catalog, product enablement, and orders.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCcw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing…' : 'Sync Catalog'}
        </Button>
      </div>

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
                          No products found. Run a catalog sync to import from Reloadly.
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
                          </TableCell>
                          <TableCell>{toNum(product.markupPercent)}%</TableCell>
                          <TableCell>{getProductStatusBadge(product.enabled)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProductId(product.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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

      <GiftCardStoreOrderDetailDialog
        orderId={selectedOrderId}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderId(null);
        }}
      />
    </div>
  );
}