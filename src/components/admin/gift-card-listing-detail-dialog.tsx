'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  giftCardAdminService,
  GiftCardListingAdmin,
} from '@/services/gift-card-admin-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import Image from 'next/image';

const EVIDENCE_LABELS = ['Front of card', 'Back of card'];

type ApiError = { response?: { data?: { message?: string } } };

const BALANCE_CHECK_URLS: Record<string, string> = {
  AMAZON: 'https://www.amazon.com/gc/balance',
  APPLE: 'https://secure.store.apple.com/shop/giftcard/balance',
  GOOGLE_PLAY: 'https://play.google.com/redeem',
  STEAM: 'https://store.steampowered.com/account/',
};

function getBrandLabel(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

interface GiftCardListingDetailDialogProps {
  listingId: string | null;
  onOpenChange: (open: boolean) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-green-500/20 text-green-500">Active</Badge>;
    case 'PENDING_REVIEW':
      return <Badge className="bg-yellow-500/20 text-yellow-500">Pending Review</Badge>;
    case 'SOLD':
      return <Badge className="bg-blue-500/20 text-blue-500">Sold</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-500/20 text-red-500">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function GiftCardListingDetailDialog({
  listingId,
  onOpenChange,
}: GiftCardListingDetailDialogProps) {
  const queryClient = useQueryClient();
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const { data: listing, isLoading } = useQuery<GiftCardListingAdmin | null>({
    queryKey: ['admin-gift-card-listing-detail', listingId],
    queryFn: () =>
      listingId ? giftCardAdminService.getListingDetail(listingId) : null,
    enabled: !!listingId,
  });

  const moderateMutation = useMutation({
    mutationFn: (params: { status: string; moderatorNote?: string }) =>
      giftCardAdminService.moderateListing(
        listingId!,
        params.status,
        params.moderatorNote,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-listing-detail', listingId] });
      queryClient.invalidateQueries({ queryKey: ['admin-gift-cards-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-gift-cards-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-gift-card-stats'] });
      toast.success(
        variables.status === 'ACTIVE'
          ? 'Listing approved and now live!'
          : 'Listing rejected',
      );
      setShowRejectInput(false);
      setRejectNote('');
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Failed to moderate listing');
    },
  });

  const handleApprove = () => {
    moderateMutation.mutate({ status: 'ACTIVE' });
  };

  const handleReject = () => {
    moderateMutation.mutate({ status: 'REJECTED', moderatorNote: rejectNote || undefined });
  };

  return (
    <Dialog open={!!listingId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gift Card Listing Details
          </DialogTitle>
          <DialogDescription>
            Review listing details, evidence, and card information
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="w-full space-y-4 animate-pulse py-4">
            <div className="h-20 bg-muted rounded-md w-full" />
            <div className="h-40 bg-muted rounded-md w-full" />
          </div>
        ) : listing ? (
          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-6 py-2">
              {/* Listing Summary */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {listing.brand} Gift Card
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {listing.denomination} {listing.cardCurrency}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(listing.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Listing ID</p>
                    <p className="font-mono text-xs mt-1">{listing.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Asking Price</p>
                    <p className="mt-1 font-bold">₦{Number(listing.askingPriceNgn).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Exchange Rate</p>
                    <p className="mt-1">1 {listing.cardCurrency} = ₦{Number(listing.exchangeRate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="mt-1">{new Date(listing.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Card Code (Admin Only) */}
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                <h4 className="font-medium mb-3 text-sm text-yellow-500 uppercase tracking-wide">
                  Card Information (Admin Only)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Card Code</p>
                    <p className="font-mono font-bold mt-1">{listing.cardCode}</p>
                  </div>
                  {listing.cardPin && (
                    <div>
                      <p className="text-muted-foreground">Card PIN</p>
                      <p className="font-mono font-bold mt-1">{listing.cardPin}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller Info */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                  Seller
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="mt-1 font-medium">
                      {listing.seller.profile?.firstName} {listing.seller.profile?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="mt-1">{listing.seller.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">KYC Status</p>
                    <p className="mt-1">{listing.seller.profile?.kycStatus || 'NONE'}</p>
                  </div>
                </div>
              </div>

              {/* Proof of Card (Admin Only) */}
              {((listing.evidenceUrls && listing.evidenceUrls.length > 0) ||
                (listing.evidenceRecords && listing.evidenceRecords.length > 0)) && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm text-yellow-500 uppercase tracking-wide">
                      Proof of Card (Admin Only)
                    </h4>
                    {(() => {
                      const balanceUrl = BALANCE_CHECK_URLS[listing.brand];
                      if (!balanceUrl) return null;
                      return (
                        <a
                          href={balanceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Verify balance on {getBrandLabel(listing.brand)}
                        </a>
                      );
                    })()}
                  </div>

                  {listing.evidenceUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {listing.evidenceUrls.map((url, i) => (
                        <a
                          key={`${url}-${i}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square rounded-lg border border-border overflow-hidden bg-muted/30 flex items-center justify-center"
                        >
                          <Image
                            src={url}
                            alt={EVIDENCE_LABELS[i] || `Proof ${i + 1}`}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.opacity = '0';
                            }}
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs px-2 py-1 flex items-center justify-between">
                            <span>{EVIDENCE_LABELS[i] || `Proof ${i + 1}`}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {listing.evidenceRecords && listing.evidenceRecords.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-3">
                        Legacy evidence records
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {listing.evidenceRecords.map((ev) => (
                          <a
                            key={ev.id}
                            href={ev.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square rounded-lg border border-border overflow-hidden bg-muted/30 flex items-center justify-center"
                          >
                            {ev.fileType.startsWith('image/') ? (
                              <Image
                                src={ev.fileUrl}
                                alt="Evidence"
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">{ev.fileType}</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ExternalLink className="h-5 w-5 text-white" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Moderator Note */}
              {listing.moderatorNote && (
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                    Moderator Note
                  </h4>
                  <p className="text-sm">{listing.moderatorNote}</p>
                </div>
              )}

              {/* Moderation Actions */}
              {listing.status === 'PENDING_REVIEW' && (
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                    Moderation Actions
                  </h4>

                  {showRejectInput ? (
                    <div className="space-y-3">
                      <textarea
                        placeholder="Rejection reason (optional)..."
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleReject}
                          disabled={moderateMutation.isPending}
                        >
                          {moderateMutation.isPending ? 'Processing...' : 'Confirm Reject'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowRejectInput(false);
                            setRejectNote('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        onClick={handleApprove}
                        disabled={moderateMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4" /> Approve & Go Live
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowRejectInput(true)}
                        disabled={moderateMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-center text-muted-foreground py-8">Listing not found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
