import React from "react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function DashboardHeader({
  title,
  description,
  actions,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-gradient-to-r from-zinc-900/50 to-black/20 p-4 rounded-lg border border-zinc-800/40 shadow-sm",
      className
    )}>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center flex-wrap gap-2 mt-2 sm:mt-0 sm:ml-4">
          {actions}
        </div>
      )}
    </div>
  )
} 