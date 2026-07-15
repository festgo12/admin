'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeService, Dispute, DisputeStatusType } from '@/services/dispute-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EvidenceViewer } from './evidence-viewer';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';
import {
  User,
  ShoppingBag,
  MessageSquare,
  Image,
  CheckCircle2,
  XCircle,
  Snowflake,
  UserCheck,
  ArrowRight,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';

function getStatusBadge(status: string) {
  switch (status) {
    case 'OPEN':
      return <Badge className="bg-orange-500/20 text-orange-500">Open</Badge>;
    case 'UNDER_REVIEW':
      return <Badge className="bg-blue-500/20 text-blue-500">Under Review</Badge>;
    case 'WAITING_FOR_USER':
      return <Badge className="bg-yellow-500/20 text-yellow-500">Waiting (User)</Badge>;
    case 'WAITING_FOR_ADMIN':
      return <Badge className="bg-purple-500/20 text-purple-500">Waiting (Admin)</Badge>;
    case 'RESOLVED':
      return <Badge className="bg-green-500/20 text-green-500">Resolved</Badge>;
    case 'REJECTED':
      return <Badge variant="destructive">Rejected</Badge>;
    case 'ESCALATED':
      return <Badge className="bg-red-500/20 text-red-500">Escalated</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

interface DisputeDetailDialogProps {
  disputeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DisputeDetailDialog({ disputeId, open, onOpenChange }: DisputeDetailDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showEvidence, setShowEvidence] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [showStatusActions, setShowStatusActions] = useState(false);

  const { data: dispute, isLoading } = useQuery({
    queryKey: ['admin-dispute-detail', disputeId],
    queryFn: () => disputeService.getDisputeDetail(disputeId),
    enabled: open && !!disputeId,
  });

  const assignMutation = useMutation({
    mutationFn: () => disputeService.assign(disputeId, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-detail', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Dispute assigned to you');
    },
    onError: () => toast.error('Failed to assign dispute'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: DisputeStatusType; reason?: string }) =>
      disputeService.updateStatus(disputeId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-detail', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Status updated');
      setShowStatusActions(false);
      setStatusReason('');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ resolution, outcome }: { resolution: string; outcome: 'RESOLVED' | 'REJECTED' }) =>
      disputeService.resolve(disputeId, resolution, outcome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-detail', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-stats'] });
      toast.success('Dispute resolved');
      setResolutionText('');
    },
    onError: () => toast.error('Failed to resolve dispute'),
  });

  const freezeMutation = useMutation({
    mutationFn: () => disputeService.freezeOrder(disputeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-detail', disputeId] });
      toast.success('Order frozen');
    },
    onError: () => toast.error('Failed to freeze order'),
  });

  const isActive = dispute && !['RESOLVED', 'REJECTED'].includes(dispute.status);

  const getNextStatuses = (currentStatus: string): { status: DisputeStatusType; label: string }[] => {
    switch (currentStatus) {
      case 'OPEN':
        return [
          { status: 'UNDER_REVIEW', label: 'Start Review' },
          { status: 'REJECTED', label: 'Reject' },
          { status: 'ESCALATED', label: 'Escalate' },
        ];
      case 'UNDER_REVIEW':
        return [
          { status: 'WAITING_FOR_USER', label: 'Ask User' },
          { status: 'WAITING_FOR_ADMIN', label: 'Ask Admin' },
          { status: 'RESOLVED', label: 'Resolve' },
          { status: 'REJECTED', label: 'Reject' },
          { status: 'ESCALATED', label: 'Escalate' },
        ];
      case 'WAITING_FOR_USER':
        return [
          { status: 'UNDER_REVIEW', label: 'Back to Review' },
          { status: 'RESOLVED', label: 'Resolve' },
          { status: 'REJECTED', label: 'Reject' },
        ];
      case 'WAITING_FOR_ADMIN':
        return [
          { status: 'UNDER_REVIEW', label: 'Back to Review' },
          { status: 'RESOLVED', label: 'Resolve' },
          { status: 'REJECTED', label: 'Reject' },
        ];
      case 'ESCALATED':
        return [
          { status: 'UNDER_REVIEW', label: 'Back to Review' },
          { status: 'RESOLVED', label: 'Resolve' },
          { status: 'REJECTED', label: 'Reject' },
        ];
      default:
        return [];
    }
  };

  if (isLoading || !dispute) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-24 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const nextStatuses = getNextStatuses(dispute.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-outfit text-lg">Dispute Details</DialogTitle>
                <DialogDescription className="font-mono text-xs mt-1">
                  {dispute.id}
                </DialogDescription>
              </div>
              {getStatusBadge(dispute.status)}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-6 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-3 w-3" /> Initiated By
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {getInitials(
                          `${dispute.initiator.profile?.firstName || ''} ${dispute.initiator.profile?.lastName || ''}`.trim() || dispute.initiator.email,
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {dispute.initiator.profile?.firstName} {dispute.initiator.profile?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{dispute.initiator.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <ShoppingBag className="h-3 w-3" /> Order
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-xs">{dispute.orderId}</p>
                    <p className="text-sm font-bold mt-1">
                      {Number(dispute.order.fiatAmount).toLocaleString()} NGN
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dispute.order.cryptoAmount} {dispute.order.ad.asset}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" /> Reason & Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{dispute.reason}</p>
                  {dispute.description && (
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                      {dispute.description}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Image className="h-3 w-3" /> Evidence
                    </CardTitle>
                    {dispute.evidence.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEvidence(true)}
                        className="h-7 text-xs"
                      >
                        View All ({dispute.evidence.length})
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {dispute.evidence.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No evidence submitted yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {dispute.evidence.slice(0, 6).map((ev) => (
                        <div
                          key={ev.id}
                          className="border border-border rounded-md p-2 flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setShowEvidence(true)}
                        >
                          {ev.fileType.startsWith('image/') ? (
                            <img
                              src={ev.url}
                              alt={ev.fileName}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="max-w-[100px]">
                            <p className="text-xs font-medium truncate">{ev.fileName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {ev.fileType.split('/')[1]?.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {dispute.evidence.length > 6 && (
                        <div className="h-14 border border-dashed border-border rounded-md flex items-center justify-center px-3">
                          <span className="text-xs text-muted-foreground">
                            +{dispute.evidence.length - 6} more
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {dispute.resolution && (
                <Card className="border-green-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-green-500 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> Resolution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{dispute.resolution}</p>
                  </CardContent>
                </Card>
              )}

              {dispute.assignee && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserCheck className="h-3 w-3" />
                  Assigned to: {dispute.assignee.profile?.firstName} {dispute.assignee.profile?.lastName}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Created: {new Date(dispute.createdAt).toLocaleString()}
                {dispute.updatedAt !== dispute.createdAt && (
                  <span> &middot; Updated: {new Date(dispute.updatedAt).toLocaleString()}</span>
                )}
              </div>

              {isActive && (
                <div className="border-t border-border pt-4 space-y-4">
                  {!dispute.assigneeId && (
                    <Button
                      onClick={() => assignMutation.mutate()}
                      disabled={assignMutation.isPending}
                      className="w-full"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      {assignMutation.isPending ? 'Assigning...' : 'Assign to Me'}
                    </Button>
                  )}

                  {dispute.assigneeId === user?.id && (
                    <>
                      {!showStatusActions ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowStatusActions(true)}
                          className="w-full"
                        >
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Change Status
                        </Button>
                      ) : (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Update Status</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              {nextStatuses.map((ns) => (
                                <Button
                                  key={ns.status}
                                  variant={ns.status === 'REJECTED' ? 'destructive' : 'outline'}
                                  size="sm"
                                  onClick={() => {
                                    if (ns.status === 'REJECTED' || ns.status === 'RESOLVED') {
                                      if (!resolutionText.trim()) {
                                        toast.error('Resolution text is required');
                                        return;
                                      }
                                      resolveMutation.mutate({
                                        resolution: resolutionText,
                                        outcome: ns.status === 'RESOLVED' ? 'RESOLVED' : 'REJECTED',
                                      });
                                    } else {
                                      statusMutation.mutate({ status: ns.status, reason: statusReason });
                                    }
                                  }}
                                  disabled={statusMutation.isPending || resolveMutation.isPending}
                                >
                                  {ns.label}
                                </Button>
                              ))}
                            </div>
                            <Textarea
                              placeholder="Reason for status change (optional for transitions, required for resolve/reject)..."
                              value={statusReason}
                              onChange={(e) => setStatusReason(e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                            <Textarea
                              placeholder="Resolution text (required for resolve/reject)..."
                              value={resolutionText}
                              onChange={(e) => setResolutionText(e.target.value)}
                              className="min-h-[80px] text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (!resolutionText.trim()) {
                                    toast.error('Resolution text is required');
                                    return;
                                  }
                                  resolveMutation.mutate({
                                    resolution: resolutionText,
                                    outcome: 'REJECTED',
                                  });
                                }}
                                disabled={resolveMutation.isPending}
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (!resolutionText.trim()) {
                                    toast.error('Resolution text is required');
                                    return;
                                  }
                                  resolveMutation.mutate({
                                    resolution: resolutionText,
                                    outcome: 'RESOLVED',
                                  });
                                }}
                                disabled={resolveMutation.isPending}
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Resolve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowStatusActions(false);
                                  setStatusReason('');
                                  setResolutionText('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {dispute.order.status !== 'DISPUTED' && dispute.order.status !== 'COMPLETED' && dispute.order.status !== 'CANCELLED' && (
                        <Button
                          variant="outline"
                          onClick={() => freezeMutation.mutate()}
                          disabled={freezeMutation.isPending}
                          className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                        >
                          <Snowflake className="mr-2 h-4 w-4" />
                          {freezeMutation.isPending ? 'Freezing...' : 'Freeze Order'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {showEvidence && (
        <EvidenceViewer
          evidence={dispute.evidence}
          open={showEvidence}
          onOpenChange={setShowEvidence}
        />
      )}
    </>
  );
}
