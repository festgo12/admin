'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  paystackAdminService,
  PaymentStats,
  PaymentTransaction,
  PaymentFilters,
} from '@/services/paystack-admin-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, RefreshCcw, Search, Eye, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaymentDetailDialog } from '@/components/admin/payment-detail-dialog';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REVERSED', label: 'Reversed' },
];

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Types' },
  { value: 'DEPOSIT', label: 'Deposits' },
  { value: 'WITHDRAWAL', label: 'Withdrawals' },
];

const PAGE_SIZE = 10;

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-500/20 text-green-500">Completed</Badge>;
    case 'PENDING':
      return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
    case 'PROCESSING':
      return <Badge className="bg-blue-500/20 text-blue-500">Processing</Badge>;
    case 'FAILED':
      return <Badge className="bg-red-500/20 text-red-500">Failed</Badge>;
    case 'REVERSED':
      return <Badge className="bg-purple-500/20 text-purple-500">Reversed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'DEPOSIT':
      return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Deposit</Badge>;
    case 'WITHDRAWAL':
      return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Withdrawal</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const filters: PaymentFilters = {
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(typeFilter !== 'ALL' && { type: typeFilter }),
    ...(search.trim() && { search: search.trim() }),
  };

  const { data: stats, isLoading: statsLoading } = useQuery<PaymentStats>({
    queryKey: ['admin-payments-stats'],
    queryFn: () => paystackAdminService.getStats(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, statusFilter, typeFilter, search],
    queryFn: () => paystackAdminService.getTransactions(page, PAGE_SIZE, filters),
  });

  const transactions: PaymentTransaction[] = data?.transactions || [];
  const meta = data?.meta;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Paystack Payments</h1>
          <p className="text-muted-foreground">Monitor deposits, withdrawals, and payment status.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              ) : (
                `₦${Number(stats?.totalDeposits || 0).toLocaleString()}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">Successful NGN fundings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              ) : (
                `₦${Number(stats?.totalWithdrawals || 0).toLocaleString()}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">Successful bank transfers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              ) : (
                meta?.total?.toLocaleString() || '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">All NGN payment transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <CardTitle>Transactions</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference, email, or name..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
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
            <div className="flex gap-1 bg-muted rounded-md p-1">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTypeFilter(t.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                    typeFilter === t.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTxId(tx.id)}
                    >
                      <TableCell>
                        <div className="font-medium">
                          {tx.wallet.user.profile?.firstName} {tx.wallet.user.profile?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{tx.wallet.user.email}</div>
                      </TableCell>
                      <TableCell>{getTypeBadge(tx.type)}</TableCell>
                      <TableCell className="font-bold">
                        {tx.type === 'DEPOSIT' ? '+' : '-'}₦{Math.abs(tx.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-xs">{new Date(tx.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Actions for payment ${tx.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedTxId(tx.id)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && (
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
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <PaymentDetailDialog
        transactionId={selectedTxId}
        onOpenChange={(open) => {
          if (!open) setSelectedTxId(null);
        }}
      />
    </div>
  );
}
