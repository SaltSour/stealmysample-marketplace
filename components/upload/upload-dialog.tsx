"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Image as ImageIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useFileUpload } from "@/hooks/use-file-upload"
import { FileType } from "@/lib/services/file-storage"
import { toast } from "sonner"
import { CoverImage } from "@/components/upload/cover-image"
import { TagSelector, categories } from "@/components/upload/tag-selector"

interface UploadDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
}

export function UploadDialog({ open, onOpenChangeAction }: UploadDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [coverImage, setCoverImage] = useState<{ url: string; file: File } | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: [] as string[]
  })

  const { upload: uploadFile, isLoading: isFileLoading } = useFileUpload(FileType.IMAGE, {
    maxSize: 50 * 1024 * 1024, // 50MB
    onSuccess: (result) => {
      setCoverImage({ url: result.url, file: result.originalFile })
      setIsUploading(false)
    },
    onError: (error) => {
      toast.error(error.message)
      setIsUploading(false)
    },
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCoverUpload = async (file: File) => {
    try {
      setIsUploading(true)
      await uploadFile(file)
    } catch (error) {
      // Error is already handled by the hook
      console.error("Upload error:", error)
      setIsUploading(false)
    }
  }

  const handleTagsChange = (type: "genre" | "instrument", tags: string[]) => {
    setFormData(prev => ({
      ...prev,
      tags: [
        ...prev.tags.filter(tag => 
          type === "genre" 
            ? !categories.genres.includes(tag)
            : !categories.instruments.includes(tag)
        ),
        ...tags
      ]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const form = new FormData()
      form.append("title", formData.title)
      form.append("description", formData.description)
      form.append("tags", JSON.stringify(formData.tags))
      
      if (!coverImage?.file) {
        console.error("Cover image is missing", coverImage)
        throw new Error("Cover image is required")
      }

      // Log the coverImage file to debug
      console.log("Submitting coverImage:", coverImage.file)
      
      form.append("coverImage", coverImage.file)

      const response = await fetch("/api/packs", {
        method: "POST",
        body: form,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create pack")
      }

      const data = await response.json()
      toast.success("Pack created! You can now add your samples.")
      router.push(data.editUrl)
    } catch (error) {
      console.error("Error creating pack:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create pack")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChangeAction(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Pack</DialogTitle>
          <DialogDescription>
            Enter the basic details for your new sample pack. You can add samples and customize other settings later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Pack Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter pack title"
                required
                minLength={3}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your pack"
                required
                minLength={10}
                maxLength={1000}
              />
            </div>

            <div>
              <Label>Categories</Label>
              <div className="grid gap-4 mt-2">
                <TagSelector
                  selectedTags={formData.tags.filter(tag => categories.genres.includes(tag))}
                  onTagsChange={(tags) => handleTagsChange("genre", tags)}
                  type="genre"
                />
                <TagSelector
                  selectedTags={formData.tags.filter(tag => categories.instruments.includes(tag))}
                  onTagsChange={(tags) => handleTagsChange("instrument", tags)}
                  type="instrument"
                />
              </div>
            </div>

            <div>
              <Label>Cover Image</Label>
              <div className="mt-2">
                <CoverImage
                  coverImage={coverImage?.url || null}
                  onImageUpload={handleCoverUpload}
                />
                {coverImage && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setCoverImage(null)}
                    type="button"
                  >
                    Reset Cover Image
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isLoading || isUploading || !coverImage || !formData.title || !formData.description}
            >
              {isLoading ? "Creating..." : "Create Pack"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 