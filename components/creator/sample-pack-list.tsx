"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { MoreVertical, Pencil, Eye, EyeOff, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SamplePack {
  id: string
  title: string
  description: string
  published: boolean
  coverImage: string | null
  samples: { id: string }[]
  stats?: {
    downloads: number
    plays: number
    revenue: number
    conversionRate: number
  }
}

export interface SamplePackListProps {
  status: "all" | "published" | "draft" | "featured"
  limit?: number
}

export function SamplePackList({ status, limit }: SamplePackListProps) {
  const [packs, setPacks] = useState<SamplePack[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [packToDelete, setPackToDelete] = useState<string | null>(null)
  const router = useRouter()

  async function fetchPacks() {
    try {
      const response = await fetch("/api/packs/creator")
      if (!response.ok) throw new Error("Failed to fetch packs")
      const data = await response.json()
      
      // Filter packs based on status
      let filteredPacks = data
      if (status === "published") {
        filteredPacks = data.filter((pack: SamplePack) => pack.published)
      } else if (status === "draft") {
        filteredPacks = data.filter((pack: SamplePack) => !pack.published)
      } else if (status === "featured") {
        filteredPacks = data.filter((pack: SamplePack) => pack.published)
          .sort((a: SamplePack, b: SamplePack) => 
            (b.stats?.downloads || 0) - (a.stats?.downloads || 0)
          )
      }
      
      // Apply limit if specified
      if (limit) {
        filteredPacks = filteredPacks.slice(0, limit)
      }
      
      setPacks(filteredPacks)
    } catch (error) {
      console.error("Error fetching packs:", error)
      toast.error("Failed to load sample packs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPacks()
  }, [status, limit])

  async function deletePack(id: string) {
    try {
      const response = await fetch(`/api/packs/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Failed to delete pack")
      }
      
      toast.success("Pack deleted successfully")
      fetchPacks()
    } catch (error) {
      console.error("Error deleting pack:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete pack")
    }
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/packs/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          published: !currentStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Failed to update pack")
      }
      
      toast.success(currentStatus ? "Pack unpublished" : "Pack published")
      fetchPacks() // Refresh the list after toggling
    } catch (error) {
      console.error("Error updating pack:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update pack status")
    }
  }

  const handleEdit = (packId: string) => {
    router.push(`/dashboard/packs/${packId}/edit`)
  }

  const handleDeleteClick = (id: string) => {
    setPackToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (packToDelete) {
      deletePack(packToDelete)
    }
    setDeleteDialogOpen(false)
    setPackToDelete(null)
  }

  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (packs.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-black/30 rounded-lg border border-zinc-800/40">
        <p className="text-zinc-400 mb-2">No {status} sample packs found</p>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/packs/new')}
          className="mt-2"
        >
          Create your first pack
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.slice(0, limit).map((pack) => (
          <div
            key={pack.id}
            className="group relative bg-black/30 rounded-lg overflow-hidden border border-zinc-800/40 hover:border-zinc-700/70 transition-all shadow-md hover:shadow-lg flex flex-col h-full"
          >
            {/* Cover Image */}
            <div className="relative aspect-[2/1] w-full bg-zinc-900/50 overflow-hidden">
              {pack.coverImage ? (
                <Image
                  src={pack.coverImage}
                  alt={pack.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
                  <span className="text-lg font-semibold text-zinc-500">{pack.title.substring(0, 2).toUpperCase()}</span>
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 text-xs rounded-full bg-black/60 backdrop-blur-md text-zinc-200 font-medium border border-zinc-800/50">
                  {pack.published ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            {/* Title and Sample Count */}
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{pack.title}</h3>
              <p className="text-sm text-zinc-400 mb-3 flex items-center">
                <span className="mr-1">{pack.samples?.length ?? 0}</span> 
                <span>{pack.samples?.length === 1 ? "sample" : "samples"}</span>
              </p>
              <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">
                {pack.description || "No description provided"}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800/30">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(pack.id)}
                  className="text-primary hover:text-primary"
                >
                  Edit
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-800/50">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => togglePublish(pack.id, pack.published)}>
                      {pack.published ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(pack.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sample pack
              and all associated files (audio samples, cover images, etc.) from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 