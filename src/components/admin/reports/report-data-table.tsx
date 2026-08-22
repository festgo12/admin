'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface DataTableProps {
  title: string;
  headers: string[];
  rows: any[][];
  loading?: boolean;
}

export function ReportDataTable({ title, headers, rows, loading }: DataTableProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available.</p>
        ) : (
          <div className="rounded-md border border-border overflow-hidden max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((h, i) => (
                    <TableHead key={i} className={i === 0 ? 'w-[100px]' : 'text-right'}>
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j} className={j === 0 ? 'text-xs' : 'text-right font-mono text-xs'}>
                        {j === 0
                          ? (() => {
                              try {
                                return format(new Date(cell), 'MMM d, yyyy');
                              } catch {
                                return cell;
                              }
                            })()
                          : typeof cell === 'number'
                            ? cell.toLocaleString()
                            : cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
