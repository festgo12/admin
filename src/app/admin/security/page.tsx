'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTable } from '@/components/admin/audit-log-table';
import { ShieldCheck } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight font-outfit">Security Center</h2>
        </div>
      </div>

      <Tabs defaultValue="audit-logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit-logs">Audit Log</TabsTrigger>
          <TabsTrigger value="user-security">User Security</TabsTrigger>
        </TabsList>
        <TabsContent value="audit-logs" className="space-y-4">
          <AuditLogTable />
        </TabsContent>
        <TabsContent value="user-security" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            User security management coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
