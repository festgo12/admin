'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminSecurityService, FraudRule } from '@/services/admin-security-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldCheck, Settings, AlertTriangle, Zap, AlertCircle } from 'lucide-react';

const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ACTION_OPTIONS = ['ALERT', 'FREEZE', 'BLOCK'];

const severityColorMap: Record<string, string> = {
  LOW: 'bg-green-500/10 text-green-500',
  MEDIUM: 'bg-yellow-500/10 text-yellow-500',
  HIGH: 'bg-orange-500/10 text-orange-500',
  CRITICAL: 'bg-red-500/10 text-red-500',
};

const actionColorMap: Record<string, string> = {
  ALERT: 'bg-blue-500/10 text-blue-500',
  FREEZE: 'bg-orange-500/10 text-orange-500',
  BLOCK: 'bg-red-500/10 text-red-500',
};

export function FraudRulesDashboard() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ threshold: number; severity: string; action: string }>({
    threshold: 0,
    severity: '',
    action: '',
  });

  const { data: rules, isLoading } = useQuery<FraudRule[]>({
    queryKey: ['admin-fraud-rules'],
    queryFn: adminSecurityService.getFraudRules,
  });

  const updateMutation = useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: Partial<FraudRule> }) =>
      adminSecurityService.updateFraudRule(ruleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-rules'] });
      toast.success('Fraud rule updated successfully');
      setEditingRule(null);
    },
    onError: () => {
      toast.error('Failed to update fraud rule');
    },
  });

  const handleEdit = (rule: FraudRule) => {
    setEditingRule(rule.id);
    setEditValues({ threshold: rule.threshold, severity: rule.severity, action: rule.action });
  };

  const handleSave = (ruleId: string) => {
    updateMutation.mutate({ ruleId, data: editValues });
  };

  const handleToggle = (rule: FraudRule) => {
    updateMutation.mutate({ ruleId: rule.id, data: { enabled: !rule.enabled } });
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-[400px] bg-muted rounded-md w-full" />
      </div>
    );
  }

  const enabledCount = rules?.filter((r) => r.enabled).length || 0;
  const criticalCount = rules?.filter((r) => r.severity === 'CRITICAL').length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledCount}</div>
            <p className="text-xs text-muted-foreground mt-1">of {rules?.length || 0} total rules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Rules</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">auto-freeze on trigger</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disabled Rules</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(rules?.length || 0) - enabledCount}</div>
            <p className="text-xs text-muted-foreground mt-1">rules not monitoring</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Fraud Detection Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules?.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <button
                        onClick={() => handleToggle(rule)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          rule.enabled ? 'bg-green-500' : 'bg-muted'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            rule.enabled ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{rule.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{rule.code}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {rule.description}
                    </TableCell>
                    <TableCell>
                      {editingRule === rule.id ? (
                        <Input
                          type="number"
                          value={editValues.threshold}
                          onChange={(e) =>
                            setEditValues({ ...editValues, threshold: parseInt(e.target.value) || 0 })
                          }
                          className="w-20 h-8"
                          min={1}
                        />
                      ) : (
                        <span className="font-mono text-sm">{rule.threshold}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRule === rule.id ? (
                        <select
                          value={editValues.severity}
                          onChange={(e) => setEditValues({ ...editValues, severity: e.target.value })}
                          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
                        >
                          {SEVERITY_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge className={severityColorMap[rule.severity] || ''}>{rule.severity}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRule === rule.id ? (
                        <select
                          value={editValues.action}
                          onChange={(e) => setEditValues({ ...editValues, action: e.target.value })}
                          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
                        >
                          {ACTION_OPTIONS.map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge className={actionColorMap[rule.action] || ''}>{rule.action}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingRule === rule.id ? (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRule(null)}
                            className="h-7 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSave(rule.id)}
                            disabled={updateMutation.isPending}
                            className="h-7 text-xs"
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rule)}
                          className="h-7 text-xs"
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!rules?.length && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No fraud rules configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
