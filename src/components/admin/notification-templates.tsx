'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  notificationService,
  NotificationTemplate,
  TemplatePayload,
} from '@/services/notification-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Pencil, Plus, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationTemplates() {
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<TemplatePayload>({});
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-notification-templates'],
    queryFn: () => notificationService.getTemplates(),
  });

  const saveMutation = useMutation({
    mutationFn: ({ type, data }: { type: string; data: TemplatePayload }) =>
      notificationService.createOrUpdateTemplate(type, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notification-templates'] });
      toast.success('Template saved successfully');
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to save template');
    },
  });

  const openEditDialog = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      emailSubject: template.emailSubject || '',
      emailBody: template.emailBody || '',
      pushTitle: template.pushTitle || '',
      pushBody: template.pushBody || '',
      inAppTitle: template.inAppTitle || '',
      inAppBody: template.inAppBody || '',
      smsBody: template.smsBody || '',
      systemBody: template.systemBody || '',
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingTemplate(null);
    setForm({
      name: '',
      emailSubject: '',
      emailBody: '',
      pushTitle: '',
      pushBody: '',
      inAppTitle: '',
      inAppBody: '',
      smsBody: '',
      systemBody: '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const type = editingTemplate?.type || form.name?.toLowerCase().replace(/\s+/g, '_') || '';
    if (!type) {
      toast.error('Template type is required');
      return;
    }
    saveMutation.mutate({ type, data: form });
  };

  const getChannelBadges = (template: NotificationTemplate) => {
    const channels: { label: string; present: boolean }[] = [
      { label: 'In-App', present: !!template.inAppTitle || !!template.inAppBody },
      { label: 'Email', present: !!template.emailSubject || !!template.emailBody },
      { label: 'Push', present: !!template.pushTitle || !!template.pushBody },
      { label: 'SMS', present: !!template.smsBody },
      { label: 'System', present: !!template.systemBody },
    ];
    return channels.filter((c) => c.present);
  };

  const updateField = (field: keyof TemplatePayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
        <p className="text-sm text-muted-foreground">
          Configure notification content for each channel and event type.
        </p>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No templates configured yet.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-mono text-xs">{template.type}</TableCell>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getChannelBadges(template).map((ch) => (
                        <Badge key={ch.label} variant="secondary" className="text-xs">
                          {ch.label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                      className="gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? `Edit: ${editingTemplate.name}` : 'New Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={form.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Order Completed"
              />
            </div>
            {!editingTemplate && (
              <div className="space-y-2">
                <Label>Type (identifier)</Label>
                <Input
                  value={form.name?.toLowerCase().replace(/\s+/g, '_') || ''}
                  disabled
                  className="font-mono text-xs"
                />
              </div>
            )}
          </div>

          <Tabs defaultValue="in-app" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="in-app">In-App</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="push">Push</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="in-app" className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.inAppTitle || ''}
                  onChange={(e) => updateField('inAppTitle', e.target.value)}
                  placeholder="In-app notification title"
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={form.inAppBody || ''}
                  onChange={(e) => updateField('inAppBody', e.target.value)}
                  placeholder="In-app notification body. Use {{variable}} for dynamic data."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={form.emailSubject || ''}
                  onChange={(e) => updateField('emailSubject', e.target.value)}
                  placeholder="Email subject line"
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={form.emailBody || ''}
                  onChange={(e) => updateField('emailBody', e.target.value)}
                  placeholder="Email body (HTML supported). Use {{variable}} for dynamic data."
                  rows={6}
                />
              </div>
            </TabsContent>

            <TabsContent value="push" className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.pushTitle || ''}
                  onChange={(e) => updateField('pushTitle', e.target.value)}
                  placeholder="Push notification title"
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={form.pushBody || ''}
                  onChange={(e) => updateField('pushBody', e.target.value)}
                  placeholder="Push notification body. Use {{variable}} for dynamic data."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="sms" className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={form.smsBody || ''}
                  onChange={(e) => updateField('smsBody', e.target.value)}
                  placeholder="SMS message body. Use {{variable}} for dynamic data."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={form.systemBody || ''}
                  onChange={(e) => updateField('systemBody', e.target.value)}
                  placeholder="System log message body. Use {{variable}} for dynamic data."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
