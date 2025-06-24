import React from "react"
import { cn } from "@/lib/utils"

interface SectionHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  align?: "left" | "center" | "right" | "between"
  spacing?: "compact" | "normal" | "wide"
  titleClassName?: string
  descriptionClassName?: string
}

export function SectionHeading({
  title,
  description,
  actions,
  className,
  size = "md",
  align = "left",
  spacing = "normal",
  titleClassName,
  descriptionClassName,
  ...props
}: SectionHeadingProps) {
  return (
    <div 
      className={cn(
        "flex flex-col gap-2",
        {
          "mb-2": spacing === "compact",
          "mb-4": spacing === "normal",
          "mb-6": spacing === "wide",
          "sm:flex-row sm:items-center sm:justify-between": align === "between",
          "text-center mx-auto": align === "center",
          "text-right ml-auto": align === "right",
        },
        className
      )} 
      {...props}
    >
      <div className={cn(
        align === "center" && "mx-auto",
        align === "right" && "ml-auto"
      )}>
        <h2 className={cn(
          "font-semibold tracking-tight",
          {
            "text-base": size === "sm",
            "text-lg": size === "md",
            "text-xl": size === "lg",
            "text-2xl": size === "xl",
          },
          titleClassName
        )}>
          {title}
        </h2>
        {description && (
          <p className={cn(
            "text-muted-foreground mt-1",
            {
              "text-xs": size === "sm",
              "text-sm": size === "md" || size === "lg",
              "text-base": size === "xl",
            },
            descriptionClassName
          )}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className={cn(
          "flex items-center gap-2",
          align === "center" && "mx-auto",
          align === "right" && "ml-auto",
          align === "between" && "mt-2 sm:mt-0"
        )}>
          {actions}
        </div>
      )}
    </div>
  )
} 