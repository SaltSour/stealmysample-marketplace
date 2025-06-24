"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutGrid,
  Library,
  Music2,
  Settings,
  PanelLeft,
  PanelRight,
  LineChart,
  ShoppingCart,
  Upload,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { UserNav } from "./user-nav"

interface SidebarProps {
  isCreator?: boolean
  role?: string
  currentSection?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  isCreatorOnly?: boolean
}

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: <LayoutGrid className="h-4 w-4" />,
      },
      {
        title: "My Library",
        href: "/dashboard/library",
        icon: <Library className="h-4 w-4" />,
      },
    ]
  },
  {
    title: "Creator",
    items: [
      {
        title: "My Packs",
        href: "/dashboard/packs",
        icon: <Music2 className="h-4 w-4" />,
        isCreatorOnly: true,
      },
      {
        title: "Upload",
        href: "/dashboard/upload",
        icon: <Upload className="h-4 w-4" />,
        isCreatorOnly: true,
      },
      {
        title: "Analytics",
        href: "/dashboard/analytics",
        icon: <LineChart className="h-4 w-4" />,
        isCreatorOnly: true,
      },
    ]
  },
  {
    title: "Account",
    items: [
      {
        title: "Orders",
        href: "/dashboard/orders",
        icon: <ShoppingCart className="h-4 w-4" />,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: <Settings className="h-4 w-4" />,
      },
    ]
  },
]

export function AceSidebar({ isCreator, role, currentSection }: SidebarProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  
  // Collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200 && window.innerWidth >= 768) {
        setIsExpanded(false)
      } else if (window.innerWidth >= 1200) {
        setIsExpanded(true)
      }
    }
    
    // Set initial state
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Whether to show text or just icons
  const showText = isExpanded || isHovering
  
  // Sidebar width classes based on state
  const sidebarWidthClasses = showText 
    ? 'w-[220px]' 
    : 'w-[56px]'
  
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-800/60 bg-black/80 backdrop-blur-lg supports-[backdrop-filter]:bg-black/60 transition-all duration-300",
        sidebarWidthClasses
      )}
      onMouseEnter={() => !isExpanded && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Logo and branding */}
      <div className="flex h-14 items-center border-b border-zinc-800/60 px-3">
        <Link href="/dashboard" className="flex items-center gap-1">
          <Logo variant="icon" size="xs" color="red" />
          {showText && (
            <span className="text-md font-semibold">StealMySample</span>
          )}
        </Link>
        
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-auto text-zinc-400 hover:text-zinc-100 hover:bg-primary/10 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelRight className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* User navigation */}
      <div className="border-b border-zinc-800/60 px-3 py-2">
        <UserNav compact={!showText} />
      </div>
      
      {/* Navigation sections */}
      <div className="flex-1 overflow-auto py-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {navSections.map((section, i) => {
          // Filter items based on creator status
          const items = section.items.filter(item => 
            !item.isCreatorOnly || isCreator
          )
          
          // Skip section if no items to show
          if (items.length === 0) return null
          
          return (
            <div 
              key={section.title} 
              className={cn(
                "px-3", 
                i > 0 ? "mt-2" : ""
              )}
            >
              {showText && (
                <h3 className="mb-1 px-2 text-xs font-medium text-zinc-400">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex h-9 items-center rounded-md px-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                        )}
                      >
                        <span className={cn(
                          "flex-shrink-0",
                          showText ? "mr-2" : "mx-auto"
                        )}>
                          {item.icon}
                        </span>
                        {showText && (
                          <span className="truncate">{item.title}</span>
                        )}
                        {isActive && showText && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"></span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </aside>
  )
} 