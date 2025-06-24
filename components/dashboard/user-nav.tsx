"use client"

import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserNavProps {
  isCollapsed?: boolean
  compact?: boolean
}

export function UserNav({ isCollapsed = false, compact = false }: UserNavProps) {
  const { data: session } = useSession()

  if (!session?.user) return null

  // Use either isCollapsed (for backward compatibility) or compact
  const shouldCollapse = isCollapsed || compact

  return (
    <div className={cn(
      "flex items-center",
      shouldCollapse ? "justify-center" : "gap-2"
    )}>
      <Avatar className="h-8 w-8 rounded-sm bg-zinc-800 ring-0">
        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
        <AvatarFallback className="bg-zinc-800">
          <User className="h-4 w-4 text-zinc-400" />
        </AvatarFallback>
      </Avatar>
      {!shouldCollapse && (
        <div className="flex flex-col">
          <span className="text-sm text-zinc-100">
            {session.user.name || "Anonymous User"}
          </span>
          <span className="text-xs text-zinc-500">
            {session.user.email}
          </span>
        </div>
      )}
    </div>
  )
} 