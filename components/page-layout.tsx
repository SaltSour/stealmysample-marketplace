import React from "react"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Container } from "@/components/ui/container"
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  breadcrumbs?: Array<{
    name: string
    href: string
    active?: boolean
  }>
  actions?: React.ReactNode
  className?: string
  containerSize?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  spacing?: "compact" | "normal" | "wide"
  titleSize?: "sm" | "md" | "lg"
}

export function PageLayout({
  children,
  title,
  description,
  breadcrumbs,
  actions,
  className,
  containerSize = "xl",
  spacing = "normal",
  titleSize = "md",
}: PageLayoutProps) {
  return (
    <div className={cn(
      "min-h-[calc(100vh-4rem)]", 
      {
        "py-3 sm:py-4": spacing === "compact",
        "py-5 sm:py-6": spacing === "normal",
        "py-6 sm:py-8": spacing === "wide",
      },
      className
    )}>
      <Container size={containerSize} gutter={spacing === "compact" ? "compact" : "normal"}>
        <div className={cn("space-y-3", {
          "space-y-2": spacing === "compact",
          "space-y-4": spacing === "normal",
          "space-y-6": spacing === "wide",
        })}>
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb segments={breadcrumbs} className={cn({
              "mb-1": spacing === "compact",
              "mb-2": spacing === "normal",
              "mb-3": spacing === "wide",
            })} />
          )}
          
          {/* Page header */}
          {(title || description || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div>
                {title && (
                  <h1 className={cn("font-bold tracking-tight", {
                    "text-xl": titleSize === "sm",
                    "text-2xl": titleSize === "md",
                    "text-3xl": titleSize === "lg",
                  })}>
                    {title}
                  </h1>
                )}
                {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
              </div>
              {actions && <div className="flex items-center gap-2 mt-2 sm:mt-0">{actions}</div>}
            </div>
          )}
          
          {/* Page content */}
          <div className={cn({
            "space-y-3": spacing === "compact",
            "space-y-5": spacing === "normal",
            "space-y-6": spacing === "wide",
          })}>
            {children}
          </div>
        </div>
      </Container>
    </div>
  )
} 