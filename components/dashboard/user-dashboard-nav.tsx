"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Library,
  Settings,
  Download,
  Heart,
  Users
} from "lucide-react"

const routes = [
  {
    label: "My Library",
    icon: Library,
    href: "/dashboard/library",
    color: "text-pink-700",
  },
  {
    label: "Downloads",
    icon: Download,
    href: "/dashboard/downloads",
    color: "text-orange-700",
  },
  {
    label: "Likes",
    icon: Heart,
    href: "/dashboard/likes",
    color: "text-emerald-500",
  },
  {
    label: "Following",
    icon: Users,
    href: "/dashboard/following",
    color: "text-green-700",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
]

export function UserDashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1 px-2 py-4">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center gap-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
            pathname === route.href
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-primary"
          )}
        >
          {route.icon && (
            <route.icon className={cn("h-4 w-4", route.color)} />
          )}
          {route.label}
        </Link>
      ))}
    </nav>
  )
} 