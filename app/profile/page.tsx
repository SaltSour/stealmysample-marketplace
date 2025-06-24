"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { 
  User, 
  Settings, 
  Package, 
  Music2,
  AtSign,
  Link as LinkIcon
} from "lucide-react"

interface Profile {
  id: string
  name: string
  username: string | null
  email: string
  image: string | null
  bio: string | null
  isCreator: boolean
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile")
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

    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return
    setIsSaving(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update profile")
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      toast.success("Profile updated successfully")

      // If username was updated, update the URL
      if (updates.username && updates.username !== profile.username) {
        router.push(`/profile/${updates.username}`)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

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
            Unable to load profile information.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          {profile.isCreator && (
            <TabsTrigger value="creator">
              <Music2 className="h-4 w-4 mr-2" />
              Creator
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
                  {profile.image ? (
                    <Image
                      src={profile.image}
                      alt={profile.username || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-full w-full p-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile.username || "Anonymous User"}</h2>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <AtSign className="h-3 w-3" />
                    {profile.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Display Name (Username)</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={profile.username || ""}
                    onChange={(e) => handleUpdateProfile({ username: e.target.value })}
                    className="pl-9"
                    placeholder="Choose a username"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be your display name and public profile URL: {profile.username ? 
                    <code className="text-primary">profile/{profile.username}</code> : 
                    <span className="italic">Set a username to get a custom URL</span>
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={profile.bio || ""}
                  onChange={(e) => handleUpdateProfile({ bio: e.target.value })}
                  placeholder="Tell us about yourself"
                />
              </div>

              <Button
                onClick={() => handleUpdateProfile(profile)}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your email address is used for login and notifications
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {profile.isCreator && (
          <TabsContent value="creator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Creator Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configure your creator profile and manage your content
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
} 