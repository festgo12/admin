'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTable } from '@/components/admin/audit-log-table';
import { SecurityOverview } from '@/components/admin/security-overview';
import { FraudRulesDashboard } from '@/components/admin/fraud-rules-dashboard';
import { RiskDashboard } from '@/components/admin/risk-dashboard';
import { SecurityAlertsTable } from '@/components/admin/security-alerts-table';
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fraud-rules">Fraud Rules</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <SecurityOverview />
        </TabsContent>
        <TabsContent value="fraud-rules" className="space-y-4">
          <FraudRulesDashboard />
        </TabsContent>
        <TabsContent value="risk" className="space-y-4">
          <RiskDashboard />
        </TabsContent>
        <TabsContent value="alerts" className="space-y-4">
          <SecurityAlertsTable />
        </TabsContent>
        <TabsContent value="audit-logs" className="space-y-4">
          <AuditLogTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
