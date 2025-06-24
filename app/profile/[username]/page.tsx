"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { User, Package, Music2, AtSign } from "lucide-react"

interface Profile {
  id: string
  name: string | null
  email: string
  image: string | null
  isCreator: boolean
  createdAt: string
  creatorProfile: {
    bio: string | null
    website: string | null
    isVerified: boolean
    samplePacks: {
      id: number
      title: string
      coverImage: string | null
      samples: {
        id: string
      }[]
    }[]
  } | null
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export default function PublicProfilePage() {
  const params = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${params.username}`)
        if (!response.ok) throw new Error("Failed to fetch profile")
        const data = await response.json()
        setProfile(data)
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.username) {
      fetchProfile()
    }
  }, [params.username])

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex items-center justify-center">
          <User className="h-8 w-8 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="text-center">
          <h2 className="text-lg font-medium">Profile not found</h2>
          <p className="text-muted-foreground mt-2">
            The user you're looking for doesn't exist.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name || "User"}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-full w-full p-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">{profile.name || "Anonymous User"}</CardTitle>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <AtSign className="h-3 w-3" />
                {profile.email}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profile.creatorProfile?.bio && (
            <p className="text-muted-foreground mb-4">{profile.creatorProfile.bio}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Member since {formatDate(profile.createdAt)}</span>
            {profile.isCreator && (
              <Badge variant="secondary">
                {profile.creatorProfile?.isVerified ? "Verified Creator" : "Creator"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {profile.isCreator && profile.creatorProfile && (
        <div className="mt-8">
          <Tabs defaultValue="packs">
            <TabsList>
              <TabsTrigger value="packs">
                <Package className="h-4 w-4 mr-2" />
                Sample Packs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="packs" className="mt-4">
              {profile.creatorProfile.samplePacks.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {profile.creatorProfile.samplePacks.map((pack) => (
                    <Card key={pack.id}>
                      <div className="relative aspect-video">
                        {pack.coverImage ? (
                          <Image
                            src={pack.coverImage}
                            alt={pack.title}
                            fill
                            className="object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <Music2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium">{pack.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {pack.samples?.length || 0} samples
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>No sample packs available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
} 