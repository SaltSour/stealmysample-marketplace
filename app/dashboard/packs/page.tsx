"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, Trash2, Upload, Package, Loader2, AlertCircle, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EyeOff } from "lucide-react"

interface Pack {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  published: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    samples: number
  }
}

export default function PacksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [packs, setPacks] = useState<Pack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<string>("all")

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch("/api/packs/my-packs")
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || "Failed to fetch packs")
        }

        const data = await response.json()
        setPacks(data)
      } catch (error) {
        console.error("Error fetching packs:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch packs")
        toast.error(error instanceof Error ? error.message : "Failed to fetch packs")
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchPacks()
    }
  }, [status])

  const filteredPacks = useMemo(() => {
    switch (selectedTab) {
      case "published":
        return packs.filter((pack) => pack.published)
      case "drafts":
        return packs.filter((pack) => !pack.published)
      default:
        return packs
    }
  }, [selectedTab, packs])

  const handleEdit = (packId: string) => {
    router.push(`/dashboard/packs/${packId}/edit`)
  }

  const handlePreview = (packId: string) => {
    router.push(`/packs/${packId}`)
  }

  const handleDelete = async (packId: string) => {
    try {
      const response = await fetch(`/api/packs/${packId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to delete pack")
      }

      setPacks((prev) => prev.filter((pack) => pack.id !== packId))
      toast.success("Sample pack deleted successfully")
    } catch (error) {
      console.error("Error deleting pack:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete pack")
    }
  }

  const handlePublishToggle = async (packId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/packs/${packId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ published: !currentStatus }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update pack status")
      }

      const updatedPack = await response.json()
      setPacks((prev) =>
        prev.map((pack) => (pack.id === packId ? updatedPack : pack))
      )
      toast.success(`Sample pack ${!currentStatus ? "published" : "unpublished"} successfully`)
    } catch (error) {
      console.error("Error updating pack status:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update pack status")
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Packs</h1>
            <p className="text-muted-foreground">
              Manage and organize your sample packs
            </p>
          </div>
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="p-3">
                <div className="aspect-video w-full bg-muted rounded-lg mb-3" />
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="h-4 bg-muted rounded w-1/4" />
              </CardContent>
              <CardFooter className="p-3 pt-0 flex justify-between">
                <div className="h-8 bg-muted rounded w-16" />
                <div className="flex gap-1">
                  <div className="h-8 bg-muted rounded w-8" />
                  <div className="h-8 bg-muted rounded w-8" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error === "Creator profile not found") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium mb-2">Creator Profile Required</h2>
        <p className="text-muted-foreground text-center mb-6">
          You need to set up your creator profile before you can create and manage packs.
        </p>
        <Button onClick={() => router.push("/become-creator")}>
          Become a Creator
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-medium mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-center mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Packs</h1>
          <p className="text-muted-foreground">
            Manage and organize your sample packs
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/packs/new")} className="dashboard-cta-primary">
          <Upload className="mr-2 h-4 w-4" />
          Create Pack
        </Button>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="dashboard-tabs-list">
          <TabsTrigger value="all" className="dashboard-tab">
            All Packs ({packs.length})
          </TabsTrigger>
          <TabsTrigger value="published" className="dashboard-tab">
            Published ({packs.filter(p => p.published).length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="dashboard-tab">
            Drafts ({packs.filter(p => !p.published).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredPacks.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-medium mb-2">No sample packs found</h2>
                <p className="text-muted-foreground mb-6">
                  {selectedTab === "published" 
                    ? "You haven't published any packs yet."
                    : selectedTab === "drafts"
                    ? "You don't have any draft packs."
                    : "Create your first sample pack to get started."}
                </p>
                <Button onClick={() => router.push("/dashboard/packs/new")}>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Pack
                </Button>
              </div>
            ) : (
              filteredPacks.map((pack) => (
                <Card key={pack.id} className="flex flex-col">
                  <CardHeader className="p-3">
                    <div className="relative aspect-video w-full mb-3">
                      <Image
                        src={pack.coverImage || "/placeholder-pack.png"}
                        alt={pack.title}
                        fill
                        className="object-cover rounded-md"
                      />
                      <Badge 
                        className="absolute top-2 right-2" 
                        variant={pack.published ? "default" : "secondary"}
                      >
                        {pack.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{pack.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {pack.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-sm">
                    <p className="text-muted-foreground">
                      {pack._count?.samples || 0} samples
                    </p>
                  </CardContent>
                  <CardFooter className="p-3 pt-0 flex justify-between mt-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="p-0 h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(pack.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePreview(pack.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePublishToggle(pack.id, pack.published)}>
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                              <span className="text-destructive">Delete</span>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the pack
                                and all associated files (audio samples, cover images, etc.) from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(pack.id)} className="dashboard-cta-accent">Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="p-0 h-8 w-8"
                        onClick={() => handleEdit(pack.id)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="p-0 h-8 w-8"
                        onClick={() => handlePreview(pack.id)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Preview</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 