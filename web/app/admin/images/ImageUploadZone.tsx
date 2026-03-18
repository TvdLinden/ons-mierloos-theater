'use client';

import { useState, useRef, useActionState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadImageAction } from './actions';

type Props = {
  onUploadComplete: () => void;
};

export function ImageUploadZone({ onUploadComplete }: Props) {
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadImageAction, undefined);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of imageFiles) {
        const fd = new FormData();
        fd.append('image', file);
        const result = await uploadImageAction(null, fd);
        if (result?.error) {
          setError(result.error);
          break;
        }
      }
      onUploadComplete();
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  const isPending = uploading || uploadPending;

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-colors ${isDragOver ? 'border-primary bg-primary/5' : ''}`}
    >
      <CardContent className="pt-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground hover:border-primary transition-colors cursor-pointer"
        >
          <Upload className={`h-8 w-8 ${isDragOver ? 'text-primary' : ''}`} />
          <span className="text-sm font-medium">
            {isDragOver
              ? 'Loslaten om te uploaden'
              : isPending
                ? 'Uploaden...'
                : 'Sleep afbeeldingen hierheen of klik om te bladeren'}
          </span>
          <span className="text-xs">PNG, JPG, GIF, WebP</span>
        </button>

        <form action={uploadAction} className="hidden">
          <input
            ref={fileInputRef}
            name="image"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) {
                uploadFiles(files);
                e.target.value = '';
              }
            }}
          />
        </form>

        {(uploadState?.error || error) && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadState?.error ?? error}</AlertDescription>
          </Alert>
        )}
        {uploadState?.success && (
          <Alert className="mt-4" variant="success">
            <AlertDescription>Afbeelding succesvol geüpload!</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
