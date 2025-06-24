"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Edit, Eye, EyeOff, Trash2, MoreVertical, Play, Download, ShoppingCart } from "lucide-react"
import { CoverImage } from "@/components/upload/cover-image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PackCardProps {
  pack: {
    id: string
    title: string
    description?: string | null
    coverImage?: string | null
    price?: number
    published?: boolean
    samples?: any[]
    stats?: {
      plays?: number
      downloads?: number
      revenue?: number
      conversionRate?: number
    }
  }
  href?: string
  variant?: "default" | "creator"
  onDelete?: (id: string) => void
  onPublishToggle?: (id: string, currentStatus: boolean) => void
  onCoverImageUpdate?: (id: string, file: File) => Promise<void>
}

export function PackCard({ 
  pack, 
  href, 
  variant = "default",
  onDelete,
  onPublishToggle,
  onCoverImageUpdate
}: PackCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    setIsLoading(true)
    try {
      await onDelete(pack.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishToggle = async () => {
    if (!onPublishToggle) return
    setIsLoading(true)
    try {
      await onPublishToggle(pack.id, pack.published || false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCoverImageUpload = async (file: File) => {
    if (!onCoverImageUpdate) return
    setIsLoading(true)
    try {
      await onCoverImageUpdate(pack.id, file)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card 
      className="card-hover group overflow-hidden bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <Link href={href || `/packs/${pack.id}`}>
          {variant === "creator" ? (
            <CoverImage
              coverImage={pack.coverImage || null}
              onImageUpload={handleCoverImageUpload}
              className="aspect-[2/1] w-full"
              mode="edit"
            />
          ) : (
            <div className="relative aspect-[2/1] w-full overflow-hidden">
              {pack.coverImage ? (
                <div className="group relative w-full h-full">
                  <Image
                    src={pack.coverImage}
                    alt={pack.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60"></div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary/20 to-secondary/20">
                  <span className="text-muted-foreground">No cover image</span>
                </div>
              )}
            </div>
          )}
        </Link>
        
        {/* Quick action buttons that appear on hover */}
        {variant !== "creator" && (
          <div className={`absolute top-2 right-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex space-x-1">
              <Button 
                size="icon" 
                variant="secondary" 
                className="bg-black/60 backdrop-blur-md h-8 w-8 rounded-full"
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="secondary" 
                className="bg-black/60 backdrop-blur-md h-8 w-8 rounded-full"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Price tag */}
        {pack.price !== undefined && pack.price > 0 && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white font-semibold">
              {formatPrice(pack.price)}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Link 
              href={href || `/packs/${pack.id}`}
              className="font-medium text-lg hover:underline hover:text-primary transition-colors"
            >
              {pack.title}
            </Link>
            {variant === "creator" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    disabled={isLoading}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/packs/${pack.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  {onPublishToggle && (
                    <DropdownMenuItem onClick={handlePublishToggle}>
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
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {pack.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {pack.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm">
            {pack.samples && (
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                {pack.samples.length} samples
              </Badge>
            )}
            {pack.published !== undefined && (
              <Badge variant={pack.published ? "default" : "secondary"} className={pack.published ? "bg-primary/20 text-primary" : ""}>
                {pack.published ? "Published" : "Draft"}
              </Badge>
            )}
          </div>

          {variant === "creator" && pack.stats && (
            <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-border/50">
              <div className="text-sm">
                <span className="text-muted-foreground">Downloads: </span>
                {pack.stats.downloads || 0}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Plays: </span>
                {pack.stats.plays || 0}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Revenue: </span>
                {formatPrice(pack.stats.revenue || 0)}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Conversion: </span>
                {((pack.stats.conversionRate || 0) * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 