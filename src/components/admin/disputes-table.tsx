'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeService, Dispute, DisputeMeta, DisputeStatusType } from '@/services/dispute-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MoreHorizontal, Eye, AlertTriangle, UserCheck, Snowflake } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DisputeDetailDialog } from './dispute-detail-dialog';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'WAITING_FOR_USER', label: 'Waiting (User)' },
  { value: 'WAITING_FOR_ADMIN', label: 'Waiting (Admin)' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const PAGE_SIZE = 20;

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

export function DisputesTable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const filters = {
    ...(statusFilter !== 'ALL' && { status: statusFilter as DisputeStatusType }),
    ...(search.trim() && { search: search.trim() }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', page, statusFilter, search],
    queryFn: () => disputeService.getDisputes(page, PAGE_SIZE, filters),
  });

  const freezeMutation = useMutation({
    mutationFn: (disputeId: string) => disputeService.freezeOrder(disputeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Order frozen successfully');
    },
    onError: () => {
      toast.error('Failed to freeze order');
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ disputeId, assigneeId }: { disputeId: string; assigneeId: string }) =>
      disputeService.assign(disputeId, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Dispute assigned');
    },
    onError: () => {
      toast.error('Failed to assign dispute');
    },
  });

  const disputes: Dispute[] = data?.disputes || [];
  const meta: DisputeMeta | undefined = data?.meta;

  if (isLoading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded-md w-1/3" />
        <div className="h-[400px] bg-muted rounded-md w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by dispute ID, reason, or email..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setStatusFilter(s.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                statusFilter === s.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispute ID</TableHead>
              <TableHead>Initiator</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No disputes found.
                </TableCell>
              </TableRow>
            ) : (
              disputes.map((dispute) => (
                <TableRow
                  key={dispute.id}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    dispute.status === 'ESCALATED' ? 'bg-red-500/5' : ''
                  }`}
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <TableCell className="font-mono text-xs max-w-[100px] truncate">
                    {dispute.id}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">
                      {dispute.initiator.profile?.firstName} {dispute.initiator.profile?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{dispute.initiator.email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-xs">{dispute.orderId.slice(0, 8)}...</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(dispute.order.fiatAmount).toLocaleString()} NGN / {dispute.order.cryptoAmount} {dispute.order.ad.asset}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-[180px] truncate" title={dispute.reason}>
                      {dispute.reason}
                    </p>
                  </TableCell>
                  <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{dispute.evidence.length}</span>
                    <span className="text-xs text-muted-foreground ml-1">files</span>
                  </TableCell>
                  <TableCell>
                    {dispute.assignee ? (
                      <div className="flex items-center gap-1">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                          {(dispute.assignee.profile?.firstName?.[0] || '') + (dispute.assignee.profile?.lastName?.[0] || '')}
                        </div>
                        <span className="text-xs">{dispute.assignee.profile?.firstName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedDispute(dispute)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {!dispute.assigneeId && (
                          <DropdownMenuItem
                            onClick={() => {
                              if (user?.id) {
                                assignMutation.mutate({ disputeId: dispute.id, assigneeId: user.id });
                              }
                            }}
                          >
                            <UserCheck className="mr-2 h-4 w-4" /> Assign to Me
                          </DropdownMenuItem>
                        )}
                        {dispute.status !== 'RESOLVED' && dispute.status !== 'REJECTED' && (
                          <DropdownMenuItem
                            onClick={() => freezeMutation.mutate(dispute.id)}
                          >
                            <Snowflake className="mr-2 h-4 w-4" /> Freeze Order
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {meta && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {meta.total === 0 ? 0 : (meta.page - 1) * PAGE_SIZE + 1}-
              {Math.min(meta.page * PAGE_SIZE, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedDispute && (
        <DisputeDetailDialog
          disputeId={selectedDispute.id}
          open={!!selectedDispute}
          onOpenChange={(open) => {
            if (!open) setSelectedDispute(null);
          }}
        />
      )}
    </div>
  );
}
