"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AudioPlayer } from "@/components/audio/audio-player"
import { Upload, X, Music2, Image as ImageIcon, AlertCircle } from "lucide-react"
import Image from "next/image"
import { formatBytes, cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface AudioMetadata {
  bpm: number
  key: string
  genre: string
  instrument: string
  keywords: string[]
  price: {
    wav: number
    stems: number
    midi: number
  }
  license: "standard" | "exclusive"
}

interface FilePreview {
  url: string
  name: string
  size: number
  type: "wav" | "stems" | "midi" | "image"
  metadata?: AudioMetadata
}

interface FileUploaderProps {
  type: "audio" | "image"
  accept?: string
  maxSize?: number
  multiple?: boolean
  onUploadAction: (files: FilePreview | FilePreview[]) => void | Promise<void>
}

export function FileUploader({
  type = "audio",
  accept = "audio/*",
  maxSize = 52428800, // 50MB default
  multiple = false,
  onUploadAction,
}: FileUploaderProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [error, setError] = useState<string | null>(null)

  const getFileType = (file: File): "wav" | "stems" | "midi" | "image" => {
    if (file.type.startsWith("image/")) return "image"
    if (file.name.endsWith(".wav")) return "wav"
    if (file.name.endsWith(".zip") || file.name.endsWith(".rar") || file.name.endsWith(".7z")) return "stems"
    if (file.name.endsWith(".mid") || file.name.endsWith(".midi")) return "midi"
    return "wav" // default to wav for other audio files
  }

  const handleUpload = async (file: File): Promise<FilePreview> => {
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return prev
        }
        return prev + 5
      })
    }, 100)

    try {
      // Here you would normally upload to your storage service
      const preview: FilePreview = {
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: getFileType(file),
      }

      setUploadProgress(100)
      setTimeout(() => {
        setUploadProgress(0)
        clearInterval(interval)
      }, 500)

      return preview
    } catch (error) {
      clearInterval(interval)
      throw error
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null)
    setUploading(true)

    try {
      const uploadedFiles = await Promise.all(
        acceptedFiles.map(handleUpload)
      )

      setPreviews(prev => [...prev, ...uploadedFiles])
      await onUploadAction(multiple ? uploadedFiles : uploadedFiles[0])

      toast({
        title: "Success",
        description: `${acceptedFiles.length} file(s) uploaded successfully`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      setError("Failed to upload files. Please try again.")
      toast({
        title: "Error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }, [multiple, onUploadAction])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      [accept]: [],
    },
    maxSize,
    multiple,
  })

  const removeFile = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg transition-colors",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-white/10 hover:border-primary/50",
          "cursor-pointer"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4">
            {type === "audio" ? (
              <Music2 className="h-10 w-10 text-muted-foreground" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          {isDragActive ? (
            <p className="text-sm text-primary">Drop the files here</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your {type} files here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                {type === "audio"
                  ? "Supported formats: WAV, MP3, AIFF (max 50MB). For stems, upload .zip, .rar, or .7z files."
                  : "Supported formats: JPG, PNG, GIF (max 50MB)"}
              </p>
            </>
          )}
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-1" />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {previews.length > 0 && (
        <div className="space-y-2">
          {previews.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-black/20"
            >
              <div className="flex items-center gap-3">
                {file.type === "image" ? (
                  <div className="relative w-10 h-10 rounded overflow-hidden">
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <AudioPlayer
                    url={file.url}
                    title={file.name}
                    bpm={file.metadata?.bpm || null}
                    musicalKey={file.metadata?.key || null}
                    variant="compact"
                  />
                )}
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                className="hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 