'use client';

import { useState, useEffect } from 'react';
import { paystackAdminService, PaymentStats, PaymentTransaction } from '@/services/paystack-admin-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, ExternalLink, RefreshCcw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PaymentsPage() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, txData] = await Promise.all([
        paystackAdminService.getStats(),
        paystackAdminService.getTransactions(page, 10),
      ]);
      setStats(statsData);
      setTransactions(txData.transactions);
      setTotalPages(txData.meta.totalPages);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge className="bg-success/20 text-success">Completed</Badge>;
      case 'PENDING': return <Badge className="bg-warning/20 text-warning">Pending</Badge>;
      case 'FAILED': return <Badge className="bg-destructive/20 text-destructive">Failed</Badge>;
      case 'REVERSED': return <Badge className="bg-primary/20 text-primary">Reversed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Paystack Payments</h1>
          <p className="text-muted-foreground">Monitor deposits and bank transfers.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-2">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats?.totalDeposits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successful NGN fundings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats?.totalWithdrawals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successful bank transfers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex items-center gap-4 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by reference or email..." className="pl-10" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading transactions...</TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">No transactions found.</TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="font-medium">{tx.wallet.user.profile.firstName}</div>
                      <div className="text-xs text-muted-foreground">{tx.wallet.user.email}</div>
                    </TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell className="font-bold">₦{tx.amount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-xs">{new Date(tx.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {/* Actions removed */}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="flex items-center justify-end space-x-2 py-4">
             <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="text-sm font-medium">Page {page} of {totalPages}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
