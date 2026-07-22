'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdsTable } from '@/components/admin/ads-table';
import { FeeConfigTab } from '@/components/admin/fee-config-tab';
import { Megaphone, Settings } from 'lucide-react';

export default function AdsPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-bold tracking-tight">Marketplace Configuration</h1>
        <p className="text-muted-foreground">
          Manage trade advertisements, sponsored listings, and platform fee configuration.
        </p>
      </div>

      <Tabs defaultValue="ads" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ads" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Advertisements
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-2">
            <Settings className="h-4 w-4" />
            Fee Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ads">
          <AdsTable />
        </TabsContent>

        <TabsContent value="fees">
          <FeeConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
