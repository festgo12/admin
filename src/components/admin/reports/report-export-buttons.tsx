'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { reportService, type ReportCategory } from '@/services/report-service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportExportButtonsProps {
  category: ReportCategory;
  startDate: string;
  endDate: string;
  title: string;
}

export function ReportExportButtons({ category, startDate, endDate, title }: ReportExportButtonsProps) {
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleCsvExport = async () => {
    setCsvLoading(true);
    try {
      const { content, filename } = await reportService.getExportData(category, startDate, endDate);
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setCsvLoading(false);
    }
  };

  const handlePdfExport = async () => {
    setPdfLoading(true);
    try {
      const data = await reportService.getPdfData(category, startDate, endDate);
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text(data.title, 14, 22);

      doc.setFontSize(10);
      doc.text(`Date Range: ${data.dateRange.startDate} to ${data.dateRange.endDate}`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

      let y = 44;
      if (data.summary) {
        doc.setFontSize(12);
        doc.text('Summary', 14, y);
        y += 8;

        const summaryRows = Object.entries(data.summary).map(([key, value]) => [
          key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
          typeof value === 'number' ? value.toLocaleString() : String(value),
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Metric', 'Value']],
          body: summaryRows,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [30, 30, 30] },
        });

        y = (doc as any).lastAutoTable.finalY + 10;
      }

      if (data.rows?.length > 0) {
        doc.setFontSize(12);
        doc.text('Daily Breakdown', 14, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [data.headers],
          body: data.rows.map((row: any[]) => row.map(String)),
          theme: 'grid',
          styles: { fontSize: 7 },
          headStyles: { fillColor: [30, 30, 30] },
        });
      }

      doc.save(`${category}-report.pdf`);
      toast.success('PDF exported successfully');
    } catch {
      toast.error('Failed to export PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleCsvExport} disabled={csvLoading}>
        <Download className="h-4 w-4 mr-1" />
        {csvLoading ? 'Exporting...' : 'Export CSV'}
      </Button>
      <Button variant="outline" size="sm" onClick={handlePdfExport} disabled={pdfLoading}>
        <FileText className="h-4 w-4 mr-1" />
        {pdfLoading ? 'Exporting...' : 'Export PDF'}
      </Button>
    </div>
  );
}
