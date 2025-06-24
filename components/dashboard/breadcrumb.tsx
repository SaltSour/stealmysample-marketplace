"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbProps {
  currentSection?: string
}

export function Breadcrumb({ currentSection }: BreadcrumbProps) {
  const pathname = usePathname()
  
  // Skip breadcrumb on main dashboard
  if (pathname === "/dashboard") {
    return null
  }
  
  // Split the path into segments
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .slice(1) // Remove 'dashboard' from segments as it's always first
  
  // Map of path segments to display names
  const pathDisplay: Record<string, string> = {
    "packs": "Sample Packs",
    "library": "My Library",
    "upload": "Upload",
    "analytics": "Analytics",
    "settings": "Settings",
    "new": "Create New",
    "edit": "Edit",
    "earnings": "Earnings",
    "orders": "Orders",
  }
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-zinc-400">
      <ol className="flex items-center space-x-1">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center hover:text-zinc-200 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>
        
        {segments.map((segment, index) => {
          // Build the href up to the current segment
          const href = `/dashboard/${segments.slice(0, index + 1).join("/")}`
          const isLast = index === segments.length - 1
          
          // Try to get display name, or capitalize first letter as fallback
          const displayName = pathDisplay[segment] || 
            segment.charAt(0).toUpperCase() + segment.slice(1)
          
          return (
            <li key={segment} className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
              <Link
                href={href}
                className={cn(
                  "ml-1 hover:text-zinc-200 transition-colors",
                  isLast ? "text-zinc-200 font-medium" : ""
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {displayName}
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
} 