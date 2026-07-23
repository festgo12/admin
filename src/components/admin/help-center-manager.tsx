'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { helpCenterService, HelpContentItem, HelpContentPayload } from '@/services/help-center-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  HelpCircle,
  MessageCircleQuestion,
  Phone,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_OPTIONS = ['ALL', 'FAQ', 'CONTACT'] as const;

export function HelpCenterManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HelpContentItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formCategory, setFormCategory] = useState('FAQ');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSortOrder, setFormSortOrder] = useState('0');

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-help-content'],
    queryFn: () => helpCenterService.getAllContent(),
  });

  const createMutation = useMutation({
    mutationFn: (data: HelpContentPayload) => helpCenterService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-content'] });
      toast.success('Help content created');
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HelpContentPayload> }) =>
      helpCenterService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-content'] });
      toast.success('Help content updated');
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update item');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => helpCenterService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-content'] });
      toast.success('Help content deleted');
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete item');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      helpCenterService.updateItem(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-content'] });
      toast.success('Visibility updated');
    },
  });

  const filteredItems = items.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: items.length,
    active: items.filter((i) => i.active).length,
    faq: items.filter((i) => i.category === 'FAQ').length,
    contact: items.filter((i) => i.category === 'CONTACT').length,
  };

  function openCreateDialog() {
    setEditingItem(null);
    setFormCategory('FAQ');
    setFormTitle('');
    setFormContent('');
    setFormSortOrder('0');
    setDialogOpen(true);
  }

  function openEditDialog(item: HelpContentItem) {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormSortOrder(String(item.sortOrder));
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingItem(null);
  }

  function handleSubmit() {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    const payload: HelpContentPayload = {
      category: formCategory,
      title: formTitle.trim(),
      content: formContent.trim(),
      sortOrder: parseInt(formSortOrder, 10) || 0,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

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
          Manage FAQ articles and contact information shown to users in the Help Center.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            Refresh
          </Button>
          <Button size="sm" onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FAQ Articles</CardTitle>
            <MessageCircleQuestion className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.faq}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact Items</CardTitle>
            <Phone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.contact}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search titles or content..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat === 'FAQ' ? 'FAQ' : 'Contact Info'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {items.length === 0
                    ? 'No help content yet. Click "Add Item" to create your first FAQ or contact entry.'
                    : 'No items match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.category === 'FAQ'
                          ? 'border-blue-500/50 text-blue-500'
                          : 'border-purple-500/50 text-purple-500'
                      }
                    >
                      {item.category === 'FAQ' ? 'FAQ' : 'Contact'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate text-sm">
                    {item.title}
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                    {item.content}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.sortOrder}</TableCell>
                  <TableCell>
                    <button
                      onClick={() =>
                        toggleActiveMutation.mutate({ id: item.id, active: !item.active })
                      }
                      className="flex items-center gap-1.5"
                    >
                      {item.active ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={`text-xs ${item.active ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {item.active ? 'On' : 'Off'}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Help Content' : 'Add Help Content'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex gap-2">
                {(['FAQ', 'CONTACT'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormCategory(cat)}
                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                      formCategory === cat
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {cat === 'FAQ' ? 'FAQ Article' : 'Contact Information'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder={formCategory === 'FAQ' ? 'e.g. How do I reset my password?' : 'e.g. Support Email'}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder={
                  formCategory === 'FAQ'
                    ? 'The answer to this question...'
                    : 'support@nairap2p.com'
                }
                rows={formCategory === 'FAQ' ? 5 : 2}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingItem
                ? 'Update'
                : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Help Content</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
