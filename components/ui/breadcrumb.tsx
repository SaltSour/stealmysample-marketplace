import * as React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: {
    name: string
    href: string
    active?: boolean
  }[]
  separator?: React.ReactNode
  home?: boolean
}

export function Breadcrumb({
  segments,
  separator = <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground/60" />,
  home = true,
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <div
      className={cn(
        "flex items-center text-xs text-muted-foreground",
        className
      )}
      {...props}
    >
      {home && (
        <>
          <Link 
            href="/" 
            className="flex items-center hover:text-primary transition-colors"
          >
            <Home className="h-3 w-3" />
            <span className="sr-only">Home</span>
          </Link>
          {separator}
        </>
      )}
      
      {segments.map((segment, index) => (
        <React.Fragment key={segment.href}>
          <Link
            href={segment.href}
            className={cn(
              "hover:text-primary transition-colors",
              segment.active && "text-foreground font-medium"
            )}
            aria-current={segment.active ? "page" : undefined}
          >
            {segment.name}
          </Link>
          {index < segments.length - 1 && separator}
        </React.Fragment>
      ))}
    </div>
  )
}
