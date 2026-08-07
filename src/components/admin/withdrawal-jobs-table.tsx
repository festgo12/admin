'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService, WithdrawalJob } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

const STATUSES = ['PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED'];

const statusClass = (status: string) =>
  status === 'CONFIRMED'
    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
    : status === 'FAILED' || status === 'EXPIRED'
      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
      : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';

export function WithdrawalJobsTable() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['withdrawal-jobs', page, status],
    queryFn: () => adminService.getWithdrawalJobs(page, limit, status),
    refetchInterval: 15000,
  });

  const jobs: WithdrawalJob[] = data?.jobs || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-medium">Withdrawal Confirmation Queue</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={!status ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatus(undefined); setPage(1); }}
            >
              All
            </Button>
            {STATUSES.map((s) => (
              <Button
                key={s}
                variant={status === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setStatus(s); setPage(1); }}
              >
                {s}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading withdrawal jobs...
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No withdrawal jobs in this state.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TxHash</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-[10px] max-w-[140px] truncate">
                      {job.txHash}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.currency}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{job.amount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-[10px] max-w-[140px] truncate">
                      {job.destination}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusClass(job.status)}>{job.status}</Badge>
                    </TableCell>
                    <TableCell>{job.attempts}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                      {job.error || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                {meta.total} job{meta.total === 1 ? '' : 's'} · page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
