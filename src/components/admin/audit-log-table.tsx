'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService, AuditLog, AuditFilters } from '@/services/audit-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCcw,
  ChevronDown,
  ChevronRight,
  Globe,
  Monitor,
  Filter,
} from 'lucide-react';

const RESOURCE_OPTIONS = ['ALL', 'AUTH', 'WALLET', 'USER', 'ORDER', 'DEVICE'] as const;
const STATUS_OPTIONS = ['ALL', 'SUCCESS', 'FAILED'] as const;
const TIME_OPTIONS = ['ALL', '24H', '7D', '30D'] as const;
const PAGE_SIZE = 20;

const CATEGORY_MAP: Record<string, string> = {
  AUTH: 'Auth',
  WALLET: 'Wallet',
  USER: 'Admin',
  ORDER: 'Orders',
  DEVICE: 'Security',
};

const ACTION_LABELS: Record<string, string> = {
  AUTH_LOGIN: 'Login',
  AUTH_LOGIN_GOOGLE: 'Google Login',
  AUTH_LOGOUT: 'Logout',
  AUTH_REGISTER: 'Register',
  AUTH_PASSWORD_CHANGE: 'Password Change',
  AUTH_PASSWORD_CHANGE_REQUEST: 'Password Reset Request',
  AUTH_2FA_ENABLE: '2FA Enabled',
  WALLET_DEPOSIT: 'Deposit',
  WALLET_WITHDRAWAL: 'Withdrawal',
  WALLET_CREATION: 'Wallet Created',
  USER_PROFILE_UPDATE: 'Profile Update',
  ADMIN_USER_STATUS_UPDATE: 'Status Update',
  ADMIN_USER_BAN: 'User Banned',
  ADMIN_USER_FREEZE: 'User Frozen',
  SECURITY_DEVICE_REMOVE: 'Device Removed',
  ORDER_CREATED: 'Order Created',
  ORDER_APPROVED: 'Order Approved',
  ORDER_DECLINED: 'Order Declined',
  ORDER_EXPIRED: 'Order Expired',
  ORDER_FRAUD_FLAGGED: 'Fraud Flagged',
};

export function AuditLogTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<string>('ALL');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getDateRange = () => {
    const now = new Date();
    switch (timeFilter) {
      case '24H':
        return { startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() };
      case '7D':
        return { startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() };
      case '30D':
        return { startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() };
      default:
        return {};
    }
  };

  const filters: AuditFilters = {
    ...(resourceFilter !== 'ALL' && { resource: resourceFilter }),
    ...(statusFilter === 'FAILED' && { success: 'false' }),
    ...(statusFilter === 'SUCCESS' && { success: 'true' }),
    ...(search.trim() && { search: search.trim() }),
    ...getDateRange(),
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-audit-stats'],
    queryFn: () => auditService.getAuditStats(),
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-audit-logs', page, filters],
    queryFn: () => auditService.getAuditLogs(page, PAGE_SIZE, filters),
  });

  const logs = data?.logs || [];
  const meta = data?.meta;

  const getActionLabel = (action: string) => ACTION_LABELS[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const getCategoryFromAction = (action: string): string => {
    if (action.startsWith('AUTH_')) return 'Auth';
    if (action.startsWith('WALLET_')) return 'Wallet';
    if (action.startsWith('ORDER_')) return 'Orders';
    if (action.startsWith('ADMIN_')) return 'Admin';
    if (action.startsWith('SECURITY_') || action.startsWith('USER_')) return 'Security';
    return 'Other';
  };

  const getCategoryBadge = (action: string) => {
    const cat = getCategoryFromAction(action);
    switch (cat) {
      case 'Auth':
        return <Badge className="bg-blue-500/20 text-blue-500">Auth</Badge>;
      case 'Wallet':
        return <Badge className="bg-green-500/20 text-green-500">Wallet</Badge>;
      case 'Orders':
        return <Badge className="bg-purple-500/20 text-purple-500">Orders</Badge>;
      case 'Admin':
        return <Badge className="bg-orange-500/20 text-orange-500">Admin</Badge>;
      case 'Security':
        return <Badge className="bg-red-500/20 text-red-500">Security</Badge>;
      default:
        return <Badge variant="secondary">{cat}</Badge>;
    }
  };

  const getStatusBadge = (success: boolean) =>
    success ? (
      <Badge className="bg-success/20 text-success">Success</Badge>
    ) : (
      <Badge className="bg-destructive/20 text-destructive">Failed</Badge>
    );

  const getInitials = (log: AuditLog) => {
    const fn = log.user?.profile?.firstName || '';
    const ln = log.user?.profile?.lastName || '';
    return (fn[0] || '') + (ln[0] || '') || '?';
  };

  if (statsLoading) {
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
          Track every sensitive operation across the platform.
        </p>
        <Button
          onClick={() => {}}
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
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.last24h.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.failures.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Resources</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byResource.length || 0}</div>
            <p className="text-xs text-muted-foreground">Distinct resource types</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, email, or IP..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-muted rounded-md p-1">
            {RESOURCE_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => { setResourceFilter(r); setPage(1); }}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                  resourceFilter === r
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === 'ALL' ? 'All' : CATEGORY_MAP[r] || r}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-muted rounded-md p-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-muted rounded-md p-1">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => { setTimeFilter(t); setPage(1); }}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                  timeFilter === t
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'ALL' ? 'All Time' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading audit logs...</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">No audit logs found.</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedRow === log.id;
                const hasDetails = log.oldValue || log.newValue || log.errorMessage || log.metadata;
                return (
                  <>
                    <TableRow
                      key={log.id}
                      className={isExpanded ? 'bg-muted/50' : ''}
                    >
                      <TableCell className="w-8">
                        {hasDetails ? (
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {getInitials(log)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {log.user?.profile?.firstName} {log.user?.profile?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{log.user?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryBadge(log.action)}
                          <span className="text-sm">{getActionLabel(log.action)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {log.resource || '-'}
                        </span>
                        {log.resourceId && (
                          <div className="text-xs text-muted-foreground font-mono truncate max-w-[120px]" title={log.resourceId}>
                            {log.resourceId.slice(0, 8)}...
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.success)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          {log.ipAddress || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {isExpanded && hasDetails && (
                      <TableRow key={`${log.id}-expanded`}>
                        <TableCell colSpan={7} className="bg-muted/30 px-8 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.oldValue && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Old Value</p>
                                <pre className="text-xs bg-background rounded-md p-3 overflow-x-auto border border-border">
                                  {JSON.stringify(log.oldValue, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">New Value</p>
                                <pre className="text-xs bg-background rounded-md p-3 overflow-x-auto border border-border">
                                  {JSON.stringify(log.newValue, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.errorMessage && (
                              <div className="md:col-span-2">
                                <p className="text-xs font-medium text-destructive mb-1">Error</p>
                                <p className="text-xs text-destructive bg-destructive/10 rounded-md p-3">
                                  {log.errorMessage}
                                </p>
                              </div>
                            )}
                            {log.metadata && (
                              <div className="md:col-span-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Metadata</p>
                                <pre className="text-xs bg-background rounded-md p-3 overflow-x-auto border border-border">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.device && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Device</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Monitor className="w-3 h-3" />
                                  <span className="truncate" title={log.device}>{log.device}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
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
    </div>
  );
}
