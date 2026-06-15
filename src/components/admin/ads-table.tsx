'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, AdminAd } from '@/services/admin-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Play, Pause, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

export function AdsTable() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ads', search],
    queryFn: () => adminService.getAds(1, 20, search),
  });

  const updateAdMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => {
      return adminService.updateAd(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      toast.success('Advertisement updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update advertisement');
    }
  });

  const deleteAdMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteAd(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      toast.success('Advertisement deleted');
    },
  });

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
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ads by asset or seller..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Ad Details</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((ad: AdminAd) => (
              <TableRow key={ad.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {ad.asset.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm tracking-tight">{ad.asset}</p>
                        {ad.isSponsored && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 h-4 flex items-center gap-0.5 border-none">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            PROMOTED
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Seller: {ad.seller?.profile?.firstName || 'User'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`font-bold border-none px-2 ${
                      ad.type === 'BUY' 
                        ? 'bg-blue-100/50 text-blue-700' 
                        : 'bg-orange-100/50 text-orange-700'
                    }`}
                  >
                    {ad.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="font-outfit font-bold text-base">₦{Number(ad.price).toLocaleString()}</p>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-medium text-muted-foreground">
                    ₦{Number(ad.minLimit).toLocaleString()} - ₦{Number(ad.maxLimit).toLocaleString()}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${ad.status === 'ACTIVE' ? 'bg-green-500' : 'bg-destructive'}`} />
                    <span className={`text-xs font-bold ${ad.status === 'ACTIVE' ? 'text-green-700' : 'text-destructive'}`}>
                      {ad.status}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted font-bold text-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 font-outfit">
                      <DropdownMenuLabel>Ad Controls</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => updateAdMutation.mutate({ 
                          id: ad.id, 
                          data: { status: ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } 
                        })}
                        className="cursor-pointer"
                      >
                        {ad.status === 'ACTIVE' ? (
                          <><Pause className="mr-2 h-4 w-4" /> Pause Ad</>
                        ) : (
                          <><Play className="mr-2 h-4 w-4" /> Activate Ad</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateAdMutation.mutate({ 
                          id: ad.id, 
                          data: { isSponsored: !ad.isSponsored } 
                        })}
                        className="cursor-pointer"
                      >
                        <Star className={`mr-2 h-4 w-4 ${ad.isSponsored ? 'fill-amber-400 text-amber-400' : ''}`} />
                        {ad.isSponsored ? 'Remove Promotion' : 'Promote Ad'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this advertisement?')) {
                            deleteAdMutation.mutate(ad.id);
                          }
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Ad
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
