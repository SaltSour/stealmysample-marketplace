import React from "react"
import { cn } from "@/lib/utils"

interface DashboardContainerProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
  fullWidth?: boolean
  transparent?: boolean
}

export function DashboardContainer({
  children,
  className,
  noPadding = false,
  fullWidth = false,
  transparent = false,
}: DashboardContainerProps) {
  return (
    <div className={cn(
      "rounded-lg border border-zinc-800/40 shadow-sm overflow-hidden transition-all duration-200",
      !transparent && "bg-gradient-to-br from-zinc-900/50 to-black/30",
      !noPadding && "p-4",
      !fullWidth && "mb-4",
      className
    )}>
      {children}
    </div>
  )
} 