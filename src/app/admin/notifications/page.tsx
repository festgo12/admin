'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationsMonitoring } from '@/components/admin/notifications-monitoring';
import { NotificationTemplates } from '@/components/admin/notification-templates';
import { NotificationResend } from '@/components/admin/notification-resend';

export default function NotificationsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-outfit">Notifications</h2>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="resend">Resend Queue</TabsTrigger>
        </TabsList>
        <TabsContent value="monitoring" className="space-y-4">
          <NotificationsMonitoring />
        </TabsContent>
        <TabsContent value="templates" className="space-y-4">
          <NotificationTemplates />
        </TabsContent>
        <TabsContent value="resend" className="space-y-4">
          <NotificationResend />
        </TabsContent>
      </Tabs>
    </div>
  );
}
