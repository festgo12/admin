'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface FeeConfig {
  id: string;
  key: string;
  value: number;
  label: string;
  updatedAt: string;
}

export function FeeConfigTab() {
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['admin-fee-configs'],
    queryFn: () => adminService.getFeeConfigs(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      adminService.updateFeeConfig(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fee-configs'] });
      toast.success('Fee configuration updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update fee configuration');
    },
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded-md w-1/3" />
        <div className="h-[200px] bg-muted rounded-md w-full" />
      </div>
    );
  }

  const items: FeeConfig[] = configs || [];

  return (
    <FeeConfigEditor items={items} updateMutation={updateMutation} />
  );
}

function FeeConfigEditor({
  items,
  updateMutation,
}: {
  items: FeeConfig[];
  updateMutation: any;
}) {
  const [edits, setEdits] = useState<Record<string, number>>({});

  const getValue = (item: FeeConfig) =>
    edits[item.key] !== undefined ? edits[item.key] : item.value;

  const hasChanges = items.some((item) => edits[item.key] !== undefined && edits[item.key] !== item.value);

  const handleSave = () => {
    const entries = Object.entries(edits).filter(([key, val]) => {
      const original = items.find((i) => i.key === key);
      return original && val !== original.value;
    });
    if (entries.length === 0) return;

    Promise.all(entries.map(([key, value]) => updateMutation.mutateAsync({ key, value })))
      .then(() => setEdits({}))
      .catch(() => {});
  };

  const handleReset = () => setEdits({});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure platform fee percentages applied to trades. Changes take effect on new orders only.
        </p>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Configuration Key</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-48">Value (%)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const currentVal = getValue(item);
              const isDirty = edits[item.key] !== undefined && edits[item.key] !== item.value;

              return (
                <TableRow key={item.key}>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {item.key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{item.label}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={10}
                        className="w-28 font-outfit font-bold"
                        value={currentVal}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [item.key]: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isDirty ? (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                        Modified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
