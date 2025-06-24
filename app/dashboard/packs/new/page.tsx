"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { UploadDialog } from "@/components/upload/upload-dialog"

export default function NewPackPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Redirect if not authenticated or not a creator
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && !session.user.isCreator) {
      router.push("/become-creator")
    }
  }, [status, session, router])

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  // Only render the upload dialog if user is authenticated and is a creator
  if (status === "authenticated" && session.user.isCreator) {
    return (
      <UploadDialog 
        open={true}
        onOpenChangeAction={(open) => {
          if (!open) {
            router.push("/dashboard/packs")
          }
        }}
      />
    )
  }

  return null
} 