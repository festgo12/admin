'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  notificationService,
  NotificationLog,
} from '@/services/notification-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCcw,
  Send,
} from 'lucide-react';

const CHANNEL_OPTIONS = ['ALL', 'IN_APP', 'PUSH', 'EMAIL', 'SYSTEM'] as const;
const PAGE_SIZE = 15;

export function NotificationsMonitoring() {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-notification-logs'],
    queryFn: () => notificationService.getLogs(1, 500),
  });

  const logs: NotificationLog[] = data?.logs || [];

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (channelFilter !== 'ALL') {
      result = result.filter((log) => log.channel === channelFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.user?.email?.toLowerCase().includes(q) ||
          log.title.toLowerCase().includes(q) ||
          log.type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [logs, channelFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const sent = logs.filter((l) => l.status === 'SENT').length;
    const failed = logs.filter((l) => l.status === 'FAILED').length;
    const pending = logs.filter((l) => l.status === 'PENDING' || l.status === 'RETRYING').length;
    return { total: logs.length, sent, failed, pending };
  }, [logs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Badge className="bg-success/20 text-success">Sent</Badge>;
      case 'FAILED':
        return <Badge className="bg-destructive/20 text-destructive">Failed</Badge>;
      case 'PENDING':
        return <Badge className="bg-warning/20 text-warning">Pending</Badge>;
      case 'RETRYING':
        return <Badge className="bg-orange-500/20 text-orange-500">Retrying</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-md" />
          ))}
        </div>
        <div className="h-[400px] bg-muted rounded-md w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Track delivery status across all notification channels.
        </p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isFetching}
        >
          <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.sent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failed.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
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
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {CHANNEL_OPTIONS.map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setChannelFilter(ch);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                channelFilter === ch
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {ch === 'ALL' ? 'All' : ch === 'IN_APP' ? 'In-App' : ch.charAt(0) + ch.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
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
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No notification logs found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{log.user?.email || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground font-mono">{log.recipient.slice(0, 20)}...</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.type}</TableCell>
                  <TableCell>{getChannelBadge(log.channel)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{log.title}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.retryCount}/{log.maxRetries}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
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
