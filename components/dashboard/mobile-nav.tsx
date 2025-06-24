import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"
import { Icons } from "@/components/icons"
import { UserNav } from "./user-nav"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface MobileNavProps {
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

// Import the same navigation sections from AceSidebar
import { navSections } from "./ace-sidebar"

export function MobileNav({ isCreator, role, currentSection }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex items-center justify-between px-3 h-14 bg-black/80 backdrop-blur-lg supports-[backdrop-filter]:bg-black/60 border-b border-zinc-800/60 shadow-sm">
      <div className="flex items-center space-x-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon-sm"
              className="md:hidden text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] bg-black/95 backdrop-blur-xl border-r border-zinc-800/60 shadow-xl">
            <SheetHeader className="h-14 px-4 flex items-center border-b border-zinc-800/60">
              <div className="flex items-center">
                <Icons.logo className="h-6 w-6 text-primary mr-2" />
                <SheetTitle className="text-base font-semibold">StealMySample</SheetTitle>
              </div>
            </SheetHeader>
            
            <div className="p-3 border-b border-zinc-800/60">
              <UserNav />
            </div>
            
            <div className="overflow-y-auto max-h-[calc(100vh-120px)]">
              {navSections.map((section) => {
                // Filter items based on creator status
                const items = section.items.filter(item => 
                  !item.isCreatorOnly || isCreator
                )
                
                if (items.length === 0) return null
                
                return (
                  <div key={section.title} className="p-3">
                    <h3 className="text-xs font-medium text-zinc-400 mb-2 px-2">
                      {section.title}
                    </h3>
                    <ul className="space-y-1">
                      {items.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                              )}
                              onClick={() => setOpen(false)}
                            >
                              <span className="mr-2 flex-shrink-0">{item.icon}</span>
                              <span>{item.title}</span>
                              {isActive && (
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
          </SheetContent>
        </Sheet>
        
        <Link href="/dashboard" className="flex items-center space-x-1">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="font-semibold text-sm">Dashboard</span>
        </Link>
      </div>
      
      <div className="flex items-center space-x-2">
        <UserNav compact />
      </div>
    </div>
  )
} 