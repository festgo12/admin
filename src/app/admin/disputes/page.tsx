'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisputesTable } from '@/components/admin/disputes-table';
import { ResolutionDashboard } from '@/components/admin/resolution-dashboard';
import { AlertTriangle, BarChart3, List } from 'lucide-react';

export default function DisputesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-outfit font-bold tracking-tight">Dispute Management</h2>
          <p className="text-muted-foreground mt-1">
            Review disputes, examine evidence, and resolve conflicts between traders.
          </p>
        </div>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue" className="gap-2">
            <List className="h-4 w-4" />
            Dispute Queue
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Resolution Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <DisputesTable />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <ResolutionDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
