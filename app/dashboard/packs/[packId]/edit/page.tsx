"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CoverImage } from "@/components/upload/cover-image"
import { SampleManager } from "@/components/upload/sample-manager"
import { useFileUpload } from "@/hooks/use-file-upload"
import { FileType } from "@/lib/services/file-storage"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music2, Upload, Save, Eye, Archive } from "lucide-react"
import { calculateMinimumPackPrice } from "@/lib/validations/sample-pack"

interface Pack {
  id: string
  title: string
  description: string
  coverImage: string | null
  price: number
  published: boolean
  archived: boolean
  kind: string
  samples: any[]
  createdAt: string
  updatedAt: string
  slug: string
}

export default function EditPackPage() {
  const params = useParams()
  const router = useRouter()
  const [pack, setPack] = useState<Pack | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { upload: uploadImage } = useFileUpload(FileType.IMAGE, {
    maxSize: 50 * 1024 * 1024, // 50MB
    onError: (error) => {
      toast.error(error.message)
    },
  })

  useEffect(() => {
    const fetchPack = async () => {
      try {
        const response = await fetch(`/api/packs/${params.packId}`)
        if (!response.ok) throw new Error("Failed to fetch pack")
        const data = await response.json()
        setPack(data)
      } catch (error) {
        console.error("Error fetching pack:", error)
        toast.error("Failed to load pack")
      }
    }

    if (params.packId) {
      fetchPack()
    }
  }, [params.packId])

  const handleSave = async () => {
    if (!pack) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/packs/${pack.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: pack.title,
          description: pack.description,
          price: pack.price,
        }),
      })

      if (!response.ok) throw new Error("Failed to update pack")
      toast.success("Pack updated successfully")
    } catch (error) {
      console.error("Error updating pack:", error)
      toast.error("Failed to update pack")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!pack) return
    setIsLoading(true)

    try {
      // Validate required fields before publishing
      if (!pack.title?.trim()) {
        throw new Error("Title is required")
      }
      if (!pack.description?.trim()) {
        throw new Error("Description is required")
      }
      if (!pack.coverImage) {
        throw new Error("Cover image is required")
      }
      if (!pack.samples || pack.samples.length === 0) {
        throw new Error("At least one sample is required")
      }
      if (!pack.price || pack.price <= 0) {
        throw new Error("Price must be greater than 0")
      }

      const response = await fetch(`/api/packs/${pack.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          published: !pack.published,
          title: pack.title,
          description: pack.description,
          coverImage: pack.coverImage,
          price: pack.price
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Failed to update pack")
      }

      setPack((prev) => prev ? { ...prev, published: !prev.published } : null)
      toast.success(pack.published ? "Pack unpublished" : "Pack published")
    } catch (error) {
      console.error("Error updating pack:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update pack status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCoverUpload = async (file: File) => {
    if (!pack) return
    setIsLoading(true)

    try {
      const result = await uploadImage(file)
      const response = await fetch(`/api/packs/${pack.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coverImage: result.url,
        }),
      })

      if (!response.ok) throw new Error("Failed to update cover image")
      setPack((prev) => prev ? { ...prev, coverImage: result.url } : null)
      toast.success("Cover image updated")
    } catch (error) {
      console.error("Error updating cover:", error)
      toast.error("Failed to update cover image")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSamplesChange = async (samples: any[]) => {
    setPack((prev) => prev ? { ...prev, samples } : null)
  }

  function getMinimumPrice(sampleCount: number): number {
    return calculateMinimumPackPrice(sampleCount);
  }

  if (!pack) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Music2 className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-30 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2563EB] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#6D28D9] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div>
          <div className="inline-flex items-center mb-2">
            <Badge variant={pack.published ? "default" : "secondary"} className="mr-2">
              {pack.published ? "Published" : "Draft"}
            </Badge>
            {pack.archived && <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-400/20">Archived</Badge>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-none mb-2">{pack.title}</h1>
          <p className="text-muted-foreground max-w-2xl">
            {pack.description.substring(0, 100)}{pack.description.length > 100 ? '...' : ''}
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto border-zinc-800/60 bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all duration-200"
            onClick={() => router.push(`/packs/${pack.slug || pack.id}`)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto bg-gradient-to-r from-[#2563EB]/10 to-[#14B8A6]/10 hover:from-[#2563EB]/20 hover:to-[#14B8A6]/20 border-zinc-800/60 text-white transition-all duration-200"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant={pack.published ? "outline" : "default"}
            className={`gap-2 w-full sm:w-auto shadow-md transition-all duration-200 ${
              pack.published 
                ? 'bg-black/30 border-zinc-800/60 hover:bg-black/50 backdrop-blur-sm' 
                : 'bg-gradient-to-r from-[#6D28D9] to-[#2563EB] hover:from-[#5B21B6] hover:to-[#1D4ED8] text-white border-0'
            }`}
            onClick={handlePublish}
            disabled={isLoading}
          >
            <Eye className="h-4 w-4" />
            {pack.published ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-8">
        <TabsList className="bg-black/40 backdrop-blur p-1 border border-zinc-800/40 w-full max-w-md mx-auto grid grid-cols-2">
          <TabsTrigger value="details" className="text-sm font-medium">
            Pack Details
          </TabsTrigger>
          <TabsTrigger value="samples" className="text-sm font-medium">
            Samples ({pack.samples.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-8 mt-4">
          {/* Cover Image */}
          <Card className="p-6 bg-black/30 border-zinc-800/40 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#6D28D9]/5 via-transparent to-[#2563EB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="space-y-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Cover Image</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    This image will be the first thing users see for your sample pack
                  </p>
                </div>
                <Badge variant={pack.coverImage ? "default" : "destructive"} className="py-1">
                  {pack.coverImage ? "Uploaded" : "Required"}
                </Badge>
              </div>
              <CoverImage
                coverImage={pack.coverImage}
                onImageUpload={handleCoverUpload}
                mode="edit"
                className="max-w-2xl rounded-lg border border-zinc-800/40 shadow-lg aspect-[2/1]"
              />
            </div>
          </Card>

          {/* Basic Info */}
          <Card className="p-6 bg-black/30 border-zinc-800/40 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#2563EB]/5 via-transparent to-[#14B8A6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="space-y-6 relative">
              <div>
                <h2 className="text-xl font-semibold text-white">Pack Information</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Make your pack stand out with a compelling title and description
                </p>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Title</Label>
                  <Input
                    id="title"
                    value={pack.title}
                    onChange={(e) =>
                      setPack((prev) =>
                        prev ? { ...prev, title: e.target.value } : null
                      )
                    }
                    placeholder="Enter a catchy title"
                    className="bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    value={pack.description}
                    onChange={(e) =>
                      setPack((prev) =>
                        prev ? { ...prev, description: e.target.value } : null
                      )
                    }
                    placeholder="Describe what makes your pack unique"
                    className="min-h-[120px] bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-white">Price (USD)</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">$</span>
                    <Input
                      id="price"
                      type="number"
                      min={pack.samples?.length ? getMinimumPrice(pack.samples.length) : 0}
                      step="0.01"
                      value={pack.price}
                      onChange={(e) => {
                        const newPrice = parseFloat(e.target.value);
                        const minPrice = pack.samples?.length ? getMinimumPrice(pack.samples.length) : 0;
                        
                        setPack((prev) => {
                          if (!prev) return null;
                          return { 
                            ...prev, 
                            price: newPrice < minPrice ? minPrice : newPrice 
                          };
                        });
                      }}
                      placeholder="19.99"
                      className="pl-8 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Minimum price: ${pack.samples?.length ? getMinimumPrice(pack.samples.length).toFixed(2) : '0.00'} 
                    ({pack.samples?.length || 0} samples × $1.99)
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="samples" className="space-y-8 mt-4">
          <Card className="p-6 bg-black/30 border-zinc-800/40">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Sample Management</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Upload and organize your samples
                  </p>
                </div>
                <Badge variant={pack.samples.length > 0 ? "default" : "destructive"} className="py-1">
                  {pack.samples.length} Sample{pack.samples.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <SampleManager
                packId={pack.id}
                initialSamples={pack.samples}
                onSamplesChange={handleSamplesChange}
                isLoading={isLoading}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 