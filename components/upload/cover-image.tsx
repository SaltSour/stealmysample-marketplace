import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ImageIcon, Upload, Pencil } from "lucide-react"

interface CoverImageProps {
  coverImage: string | null
  onImageUpload: (file: File) => void | Promise<void>
  className?: string
  mode?: "create" | "edit"
}

export function CoverImage({
  coverImage,
  onImageUpload,
  className,
  mode = "create"
}: CoverImageProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await onImageUpload(acceptedFiles[0])
    }
  }, [onImageUpload])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  })

  // If we're in edit mode and have a cover image, only show the cover with modify overlay
  if (mode === "edit" && coverImage) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          "relative aspect-[2/1] w-full rounded-lg overflow-hidden cursor-pointer group",
          className
        )}
      >
        <input {...getInputProps()} />
        <Image
          src={coverImage}
          alt="Cover image"
          fill
          className="object-cover transition-opacity"
        />
        <div className={cn(
          "absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity",
          "group-hover:opacity-100",
          isDragActive && "opacity-100 bg-primary/20"
        )}>
          <div className="flex flex-col items-center text-white">
            <Pencil className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">
              {isDragActive ? "Drop to upload" : "Modify Cover"}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Default create mode or no cover image yet
  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative aspect-[2/1] w-full rounded-lg overflow-hidden cursor-pointer group",
        className
      )}
    >
      <input {...getInputProps()} />
      
      {coverImage ? (
        <>
          <Image
            src={coverImage}
            alt="Cover image"
            fill
            className="object-cover transition-opacity"
          />
          <div className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity",
            "group-hover:opacity-100",
            isDragActive && "opacity-100 bg-primary/20"
          )}>
            <div className="flex flex-col items-center text-white">
              <Upload className="w-8 h-8 mb-2" />
              <span className="text-sm">
                {isDragActive ? "Drop to upload" : "Click or drag to modify"}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className={cn(
          "h-full w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors",
          isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25",
          "group-hover:border-primary/50"
        )}>
          <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center px-4">
            Drag and drop your image files here, or click to select
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supported formats: JPG, PNG, GIF (max 50MB)
          </p>
        </div>
      )}
    </div>
  )
} 