import * as React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  gutter?: boolean | "compact" | "normal" | "wide"
  className?: string
}

export function Container({
  children,
  size = "xl",
  gutter = true,
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        {
          // Gutter options
          "px-3 sm:px-4": gutter === "compact",
          "px-4 sm:px-6": gutter === true || gutter === "normal",
          "px-6 sm:px-8": gutter === "wide",
          
          // Container sizes with improved breakpoints
          "max-w-xs mx-auto": size === "xs",
          "max-w-screen-sm mx-auto": size === "sm",
          "max-w-screen-md mx-auto": size === "md",
          "max-w-screen-lg mx-auto": size === "lg",
          "max-w-screen-xl mx-auto": size === "xl",
          "max-w-screen-2xl mx-auto": size === "2xl",
          "w-full": size === "full",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 