'use client';

import { DisputeEvidence } from '@/services/dispute-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Image, Video, Download, User } from 'lucide-react';

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (fileType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
  return <FileText className="h-5 w-5 text-orange-500" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(fileType: string) {
  return fileType.startsWith('image/');
}

function isVideo(fileType: string) {
  return fileType.startsWith('video/');
}

interface EvidenceViewerProps {
  evidence: DisputeEvidence[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EvidenceViewer({ evidence, open, onOpenChange }: EvidenceViewerProps) {
  const getUploaderName = (item: DisputeEvidence) => {
    const fn = item.uploadedBy.profile?.firstName || '';
    const ln = item.uploadedBy.profile?.lastName || '';
    return `${fn} ${ln}`.trim() || item.uploadedBy.email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-outfit">Evidence Files</DialogTitle>
          <DialogDescription>
            {evidence.length} file{evidence.length !== 1 ? 's' : ''} submitted as evidence
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {evidence.map((item) => (
              <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(item.fileType)}
                    <div>
                      <p className="text-sm font-medium">{item.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(item.fileSize)} &middot; {item.fileType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      {getUploaderName(item)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-background">
                  {isImage(item.fileType) ? (
                    <div className="relative">
                      <img
                        src={item.url}
                        alt={item.fileName}
                        className="max-w-full max-h-[400px] rounded-md mx-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : isVideo(item.fileType) ? (
                    <video
                      controls
                      className="max-w-full max-h-[400px] rounded-md mx-auto"
                      preload="metadata"
                    >
                      <source src={item.url} type={item.fileType} />
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{item.fileName}</p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <Download className="h-4 w-4" />
                        Download File
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {evidence.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No evidence files submitted yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
