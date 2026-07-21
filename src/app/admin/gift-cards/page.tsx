'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  giftCardAdminService,
  GiftCardStats,
  GiftCardListingAdmin,
  GiftCardFilters,
} from '@/services/gift-card-admin-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Search, Eye, RefreshCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GiftCardListingDetailDialog } from '@/components/admin/gift-card-listing-detail-dialog';

const LISTING_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'REJECTED', label: 'Rejected' },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'CREATED', label: 'Created' },
  { value: 'PENDING_DELIVERY', label: 'Pending Delivery' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAGE_SIZE = 10;

function getListingStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-green-500/20 text-green-500">Active</Badge>;
    case 'PENDING_REVIEW':
      return <Badge className="bg-yellow-500/20 text-yellow-500">Pending Review</Badge>;
    case 'SOLD':
      return <Badge className="bg-blue-500/20 text-blue-500">Sold</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-500/20 text-red-500">Rejected</Badge>;
    case 'PAUSED':
      return <Badge className="bg-gray-500/20 text-gray-500">Paused</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-500/20 text-green-500">Completed</Badge>;
    case 'PENDING_DELIVERY':
      return <Badge className="bg-yellow-500/20 text-yellow-500">Pending Delivery</Badge>;
    case 'CREATED':
      return <Badge className="bg-blue-500/20 text-blue-500">Created</Badge>;
    case 'CANCELLED':
      return <Badge className="bg-red-500/20 text-red-500">Cancelled</Badge>;
    case 'DISPUTED':
      return <Badge className="bg-orange-500/20 text-orange-500">Disputed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getBrandBadge(brand: string) {
  const labels: Record<string, string> = {
    AMAZON: '🛒 Amazon',
    APPLE: '🍎 Apple',
    STEAM: '🎮 Steam',
    GOOGLE_PLAY: '▶️ Google Play',
    VISA_GIFT: '💳 Visa',
    MASTERCARD_GIFT: '💳 Mastercard',
    OTHER: '🎁 Other',
  };
  return <Badge variant="outline">{labels[brand] || brand}</Badge>;
}

export default function GiftCardsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState('ALL');
  const [listingPage, setListingPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderPage, setOrderPage] = useState(1);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const listingFilters: GiftCardFilters = {
    ...(listingStatusFilter !== 'ALL' && { status: listingStatusFilter }),
    ...(listingSearch.trim() && { search: listingSearch.trim() }),
  };

  const orderFilters: GiftCardFilters = {
    ...(orderStatusFilter !== 'ALL' && { status: orderStatusFilter }),
    ...(orderSearch.trim() && { search: orderSearch.trim() }),
  };

  const { data: stats, isLoading: statsLoading } = useQuery<GiftCardStats>({
    queryKey: ['admin-gift-card-stats'],
    queryFn: () => giftCardAdminService.getStats(),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-gift-cards-pending', listingPage],
    queryFn: () =>
      giftCardAdminService.getListings(listingPage, PAGE_SIZE, {
        status: 'PENDING_REVIEW',
      }),
  });

  const { data: listingData, isLoading: listingLoading } = useQuery({
    queryKey: ['admin-gift-cards-listings', listingPage, listingStatusFilter, listingSearch],
    queryFn: () => giftCardAdminService.getListings(listingPage, PAGE_SIZE, listingFilters),
  });

  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['admin-gift-cards-orders', orderPage, orderStatusFilter, orderSearch],
    queryFn: () => giftCardAdminService.getOrders(orderPage, PAGE_SIZE, orderFilters),
  });

  const pendingListings: GiftCardListingAdmin[] = pendingData?.data || [];
  const allListings: GiftCardListingAdmin[] = listingData?.data || [];
  const orders = orderData?.data || [];
  const listingMeta = listingData?.meta;
  const orderMeta = orderData?.meta;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Gift Cards</h1>
          <p className="text-muted-foreground">Manage gift card listings, moderation, and orders.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <RefreshCcw className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                stats?.pendingReview || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting moderation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                stats?.activeListings || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Live in marketplace</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                stats?.completedOrders || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Successful trades</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume (30d)</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              ) : (
                `₦${Number(stats?.totalVolumeNgn || 0).toLocaleString()}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending Review
            {stats?.pendingReview ? (
              <Badge className="ml-1 bg-yellow-500/20 text-yellow-500">{stats.pendingReview}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="listings">All Listings</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* Pending Review Tab */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Listings Awaiting Moderation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Card Value</TableHead>
                      <TableHead>Asking Price</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 bg-muted rounded animate-pulse" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : pendingListings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No pending listings to review. 🎉
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingListings.map((listing) => (
                        <TableRow
                          key={listing.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedListingId(listing.id)}
                        >
                          <TableCell>
                            <div className="font-medium">
                              {listing.seller.profile?.firstName} {listing.seller.profile?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{listing.seller.email}</div>
                          </TableCell>
                          <TableCell>{getBrandBadge(listing.brand)}</TableCell>
                          <TableCell className="font-bold">
                            {listing.denomination} {listing.cardCurrency}
                          </TableCell>
                          <TableCell className="font-bold">
                            ₦{Number(listing.askingPriceNgn).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {listing.evidenceUrls?.length || 0} file(s)
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedListingId(listing.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Listings Tab */}
        <TabsContent value="listings" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <CardTitle>All Listings</CardTitle>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by currency or seller..."
                      className="pl-10"
                      value={listingSearch}
                      onChange={(e) => {
                        setListingSearch(e.target.value);
                        setListingPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {LISTING_STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      setListingStatusFilter(s.value);
                      setListingPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                      listingStatusFilter === s.value
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
                      <TableHead>Seller</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Card Value</TableHead>
                      <TableHead>Asking Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listingLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 bg-muted rounded animate-pulse" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : allListings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No listings found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      allListings.map((listing) => (
                        <TableRow
                          key={listing.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedListingId(listing.id)}
                        >
                          <TableCell>
                            <div className="font-medium">
                              {listing.seller.profile?.firstName} {listing.seller.profile?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{listing.seller.email}</div>
                          </TableCell>
                          <TableCell>{getBrandBadge(listing.brand)}</TableCell>
                          <TableCell className="font-bold">
                            {listing.denomination} {listing.cardCurrency}
                          </TableCell>
                          <TableCell className="font-bold">
                            ₦{Number(listing.askingPriceNgn).toLocaleString()}
                          </TableCell>
                          <TableCell>{getListingStatusBadge(listing.status)}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedListingId(listing.id)}
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

              {listingMeta && (
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {listingMeta.total === 0
                      ? 'No results'
                      : `Showing ${(listingMeta.page - 1) * PAGE_SIZE + 1}-${Math.min(listingMeta.page * PAGE_SIZE, listingMeta.total)} of ${listingMeta.total}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setListingPage((p) => Math.max(1, p - 1))}
                      disabled={listingPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium">
                      Page {listingMeta.page} of {listingMeta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setListingPage((p) => Math.min(listingMeta.totalPages, p + 1))}
                      disabled={listingPage === listingMeta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <CardTitle>Gift Card Orders</CardTitle>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by buyer or seller..."
                      className="pl-10"
                      value={orderSearch}
                      onChange={(e) => {
                        setOrderSearch(e.target.value);
                        setOrderPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {ORDER_STATUS_OPTIONS.map((s) => (
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
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 bg-muted rounded animate-pulse" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="font-medium">
                              {order.buyer.profile?.firstName} {order.buyer.profile?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{order.buyer.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {order.seller.profile?.firstName} {order.seller.profile?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{order.seller.email}</div>
                          </TableCell>
                          <TableCell>{getBrandBadge(order.listing?.brand || 'OTHER')}</TableCell>
                          <TableCell className="font-bold">
                            ₦{Number(order.totalPaidNgn).toLocaleString()}
                          </TableCell>
                          <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {orderMeta && (
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {orderMeta.total === 0
                      ? 'No results'
                      : `Showing ${(orderMeta.page - 1) * PAGE_SIZE + 1}-${Math.min(orderMeta.page * PAGE_SIZE, orderMeta.total)} of ${orderMeta.total}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                      disabled={orderPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium">
                      Page {orderMeta.page} of {orderMeta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderPage((p) => Math.min(orderMeta.totalPages, p + 1))}
                      disabled={orderPage === orderMeta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <GiftCardListingDetailDialog
        listingId={selectedListingId}
        onOpenChange={(open) => {
          if (!open) setSelectedListingId(null);
        }}
      />
    </div>
  );
}
