import { useState } from "react"
import { FileType } from "@/lib/services/file-storage"
import { toast } from "sonner"

interface UploadOptions {
  type: FileType
  onSuccess?: (data: { url: string; path: string }) => void
  onError?: (error: Error) => void
}

interface UploadState {
  isUploading: boolean
  progress: number
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
  })

  const upload = async (file: File, options: UploadOptions) => {
    setState({ isUploading: true, progress: 0 })

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", options.type)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Upload failed")
      }

      const data = await response.json()
      options.onSuccess?.(data)
      return data
    } catch (error) {
      console.error("Upload error:", error)
      const message = error instanceof Error ? error.message : "Upload failed"
      toast.error(message)
      options.onError?.(error as Error)
      throw error
    } finally {
      setState({ isUploading: false, progress: 0 })
    }
  }

  const deleteFile = async (url: string) => {
    try {
      const response = await fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Delete failed")
      }

      return await response.json()
    } catch (error) {
      console.error("Delete error:", error)
      const message = error instanceof Error ? error.message : "Delete failed"
      toast.error(message)
      throw error
    }
  }

  return {
    upload,
    deleteFile,
    isUploading: state.isUploading,
    progress: state.progress,
  }
} 