"use client"

import { useSession } from "next-auth/react"
import { AceSidebar } from "@/components/dashboard/ace-sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Breadcrumb } from "@/components/dashboard/breadcrumb"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  
  const currentSection = pathname.split('/')[2] || 'dashboard'

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl opacity-30"></div>
      </div>
      
      <div className="hidden md:block flex-shrink-0 relative z-10">
        <AceSidebar 
          isCreator={session?.user?.isCreator} 
          role={session?.user?.role}
          currentSection={currentSection}
        />
      </div>

      <div className="fixed left-0 right-0 top-0 z-50 md:hidden">
        <MobileNav 
          isCreator={session?.user?.isCreator} 
          role={session?.user?.role}
          currentSection={currentSection}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-screen md:ml-[220px] relative z-10">
        <main className="flex-1 flex flex-col p-4">
          <div className="w-full mx-auto pt-[60px] md:pt-2">
            <div className="mb-3">
              <Breadcrumb currentSection={currentSection} />
            </div>
            
            <div className={cn(
              "overflow-hidden",
              pathname === "/dashboard" 
                ? "rounded-lg bg-black/30 backdrop-blur-sm border border-zinc-800/40 shadow-sm p-3 sm:p-4" 
                : "p-0"
            )}>
              {children}
            </div>
          </div>
        </main>
        
        <footer className="mt-auto py-3 text-center text-xs text-zinc-500 border-t border-zinc-800/30">
          <p>StealMySample Dashboard &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  )
} 