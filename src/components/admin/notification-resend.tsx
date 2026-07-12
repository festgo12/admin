'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  notificationService,
  NotificationLog,
} from '@/services/notification-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, RefreshCcw, Send, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

export function NotificationResend() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-notification-logs-resend'],
    queryFn: () => notificationService.getLogs(1, 500),
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => notificationService.resendNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notification-logs-resend'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notification-logs'] });
      toast.success('Notification queued for resend');
    },
    onError: () => {
      toast.error('Failed to resend notification');
    },
  });

  const failedLogs = (data?.logs || []).filter(
    (log: NotificationLog) => log.status === 'FAILED' || log.status === 'RETRYING'
  );

  const filteredLogs = search.trim()
    ? failedLogs.filter((log: NotificationLog) => {
        const q = search.toLowerCase();
        return (
          log.user?.email?.toLowerCase().includes(q) ||
          log.title.toLowerCase().includes(q) ||
          log.type.toLowerCase().includes(q)
        );
      })
    : failedLogs;

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'IN_APP':
        return <Badge variant="outline">In-App</Badge>;
      case 'PUSH':
        return <Badge variant="outline" className="border-blue-500/50 text-blue-500">Push</Badge>;
      case 'EMAIL':
        return <Badge variant="outline" className="border-purple-500/50 text-purple-500">Email</Badge>;
      case 'SYSTEM':
        return <Badge variant="outline" className="border-gray-500/50 text-gray-500">System</Badge>;
      default:
        return <Badge variant="secondary">{channel}</Badge>;
    }
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span>{filteredLogs.length} failed or retrying notification(s)</span>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-notification-logs-resend'] })}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isFetching}
        >
          <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by email, title, or type..."
          className="pl-10"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No failed notifications. All good!
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{log.user?.email || 'Unknown'}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.type}</TableCell>
                  <TableCell>{getChannelBadge(log.channel)}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm">{log.title}</TableCell>
                  <TableCell>
                    {log.status === 'FAILED' ? (
                      <Badge className="bg-destructive/20 text-destructive">Failed</Badge>
                    ) : (
                      <Badge className="bg-orange-500/20 text-orange-500">Retrying</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.retryCount}/{log.maxRetries}
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    {log.errorDetails ? (
                      <span className="text-xs text-destructive truncate block" title={log.errorDetails}>
                        {log.errorDetails.slice(0, 40)}...
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resendMutation.mutate(log.id)}
                      disabled={resendMutation.isPending}
                      className="gap-1"
                    >
                      {resendMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      Resend
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing {filteredLogs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
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
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
