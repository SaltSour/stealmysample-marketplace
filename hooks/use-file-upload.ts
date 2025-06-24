import { useState, useCallback } from 'react';
import { FileType, FileStorageService } from '@/lib/services/file-storage';

export interface UploadOptions {
  maxSize?: number;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onSuccess?: (result: any) => void;
  allowedTypes?: string[];
}

export function useFileUpload(type: FileType, options: UploadOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (file: File) => {
    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Définir une taille maximale par défaut de 50MB si elle n'est pas spécifiée
      const maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB par défaut
      
      // Check file size
      if (file.size > maxSize) {
        throw new Error(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
      }

      // Check file type if allowedTypes is specified
      if (options.allowedTypes && options.allowedTypes.length > 0) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const isAllowed = extension && options.allowedTypes.some(
          ext => ext.toLowerCase().includes(extension)
        );

        if (!isAllowed) {
          throw new Error(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
        }
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // Upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }

      // Report progress at 100% after successful fetch
      setProgress(100);
      options.onProgress?.(100);
      
      const result = await response.json();
      // Add the original file to the result so it can be used later
      const resultWithFile = {
        ...result,
        originalFile: file
      };
      options.onSuccess?.(resultWithFile);
      return resultWithFile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error during upload');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [type, options]);

  return {
    upload,
    isLoading,
    progress,
    error,
  };
} 