'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SecurePlayer from '@/components/audio/secure-player';
import { FileType } from '@/lib/services/file-storage';
import { Icons } from '@/components/icons';
import { Plus, ArrowDownToLine } from 'lucide-react';

interface S3SampleUploadProps {
  sampleId: string;
  onUploadComplete?: (data: UploadResult) => void;
  showPreview?: boolean;
}

interface UploadResult {
  url: string;
  path: string;
  storageType: 's3' | 'local';
}

export default function S3SampleUpload({
  sampleId,
  onUploadComplete,
  showPreview = true,
}: S3SampleUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.includes('audio/wav')) {
      setError('Please upload a WAV file');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', FileType.AUDIO);
      formData.append('sampleId', sampleId);
      formData.append('generatePreview', 'true');

      // Upload file
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await res.json();
      setHasAudio(true);
      
      // Notify parent component
      onUploadComplete?.(data);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Audio File (WAV)
        </label>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(`file-upload-${sampleId}`)?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.add className="mr-2 h-4 w-4" />
            )}
            {hasAudio ? 'Replace Audio' : 'Upload WAV File'}
          </Button>
          
          <input
            id={`file-upload-${sampleId}`}
            type="file"
            accept="audio/wav"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Upload progress */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>

      {/* Audio preview */}
      {hasAudio && showPreview && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Preview</div>
          <SecurePlayer
            sampleId={sampleId}
            isPreview={true}
            showWaveform={true}
          />
        </div>
      )}

      {/* Full quality player (only visible after purchase) */}
      {hasAudio && showPreview && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Full Quality (After Purchase)</div>
          <SecurePlayer
            sampleId={sampleId}
            isPreview={false}
            format="WAV"
            showWaveform={true}
          />
        </div>
      )}

      {/* Download button */}
      {hasAudio && (
        <div className="mt-4">
          <Button 
            variant="default"
            onClick={async () => {
              try {
                const res = await fetch(`/api/download/sample/${sampleId}?format=WAV`);
                if (!res.ok) {
                  throw new Error('Download failed - ensure you have purchased this sample');
                }
                const data = await res.json();
                window.location.href = data.url;
              } catch (error) {
                setError('Failed to download - you may need to purchase this sample first');
              }
            }}
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Download Sample
          </Button>
        </div>
      )}
    </div>
  );
} 