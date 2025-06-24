"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { UploadDialog } from "@/components/upload/upload-dialog"
import { Logo } from "@/components/logo"
import { useCartCount } from "@/lib/hooks/use-cart-count"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Menu, ShoppingCart, User, Music2, Upload, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_LINKS } from "@/lib/constants"
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet"

// Define the nav links to show (excluding Creators and Pricing)
const FILTERED_NAV_LINKS = NAV_LINKS.filter(link => 
  link.label !== "Creators" && link.label !== "Pricing"
)

// Navigation categories based on wavs.com
const categories = {
  browse: {
    title: "BROWSE",
    items: [
      { label: "All Samples", href: "/samples" },
      { label: "Featured", href: "/samples?featured=true" },
      { label: "New Releases", href: "/samples?sort=latest" },
      { label: "Top Charts", href: "/samples?sort=popular" },
      { label: "Free Samples", href: "/samples?free=true" },
    ],
  },
  genres: {
    title: "GENRES",
    items: [
      { label: "Hip-Hop, Trap", href: "/samples?genres=hip-hop,trap" },
      { label: "House, Techno", href: "/samples?genres=house,techno" },
      { label: "Pop, R&B", href: "/samples?genres=pop,rnb" },
      { label: "Afrobeats", href: "/samples?genres=afrobeats" },
      { label: "Latin", href: "/samples?genres=latin" },
      { label: "View All Genres", href: "/samples?view=genres" },
    ]
  },
  instruments: {
    title: "INSTRUMENTS",
    items: [
      { label: "Guitar", href: "/samples?instruments=guitar" },
      { label: "Piano", href: "/samples?instruments=piano" },
      { label: "Drums", href: "/samples?instruments=drums" },
      { label: "Bass", href: "/samples?instruments=bass" },
      { label: "Synth", href: "/samples?instruments=synth" },
      { label: "View All Instruments", href: "/samples?view=instruments" },
    ]
  }
}

// Search Dialog Component
function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/samples?q=${encodeURIComponent(searchQuery.trim())}`)
      onOpenChange(false)
    }
  }
  
  // Quick search suggestions
  const suggestions = [
    "Drums", "Bass", "Guitar", "Piano", "Vocals", 
    "Hip Hop", "Electronic", "R&B", "Pop", "Lo-Fi"
  ]
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black/95 backdrop-blur-sm border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-center">Search Samples</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSearch} className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for samples, genres, instruments..."
            className="pl-10 bg-zinc-900 border-zinc-800 focus-visible:ring-primary"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Popular Searches</h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-primary"
                onClick={() => {
                  router.push(`/samples?q=${encodeURIComponent(suggestion)}`)
                  onOpenChange(false)
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Custom AuthButton component that directly controls the dialog
function AuthButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex">
      <AuthDialog isOpen={isOpen} onCloseAction={() => setIsOpen(false)}>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-zinc-800/60 bg-black/40 text-white hover:bg-zinc-800/80 hidden sm:flex auth-button"
          onClick={() => setIsOpen(true)}
        >
          Sign In
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="sm:hidden text-zinc-400 hover:text-white hover:bg-zinc-800/50 auth-button"
          onClick={() => setIsOpen(true)}
        >
          <User className="h-4 w-4" />
        </Button>
      </AuthDialog>
    </div>
  )
}

// Custom Mobile Auth Button for the mobile menu
function MobileAuthButton() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="w-full">
      <AuthDialog isOpen={isOpen} onCloseAction={() => setIsOpen(false)}>
        <Button 
          variant="default" 
          className="w-full auth-button"
          onClick={() => setIsOpen(true)}
        >
          Sign In
        </Button>
      </AuthDialog>
    </div>
  )
}

export function NavBar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { count } = useCartCount()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Track scroll for navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check on initial load
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  // Handle direct search from navbar
  const handleDirectSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/samples?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }
  
  // Determine if the path is active
  const isPathActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      <header 
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          isScrolled 
            ? "bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60 border-b border-zinc-800/40 shadow-lg"
            : "bg-gradient-to-b from-black/70 via-black/40 to-transparent"
        )}
      >
        {/* Effets de glow pour la navbar */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-2 left-1/4 w-[200px] h-[50px] bg-primary/10 rounded-full blur-[50px] opacity-70"></div>
          <div className="absolute -top-4 right-1/4 w-[300px] h-[50px] bg-primary/5 rounded-full blur-[70px] opacity-60"></div>
        </div>
        
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center relative">
          {/* Logo and left side */}
          <div className="flex items-center w-1/4">
            <Link href="/" className="group flex items-center gap-1.5 hover:opacity-95 transition-all duration-300">
              {/* Use icon for mobile and full logo for desktop */}
              <div className="hidden sm:block relative">
                <div className="absolute -inset-1 bg-primary/10 rounded-full blur-md opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Logo variant="full" color="white" size="sm" />
              </div>
              <div className="sm:hidden relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Logo variant="icon" color="red" size="xs" />
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation - centered in the middle 50% */}
          <nav className="hidden md:flex items-center justify-center w-2/4">
            <div className="flex items-center space-x-6">
              {FILTERED_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 relative",
                    isPathActive(link.href)
                      ? "text-primary font-semibold"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  {link.label}
                  {isPathActive(link.href) && (
                    <>
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-primary rounded-full"></span>
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-primary/30 blur-sm rounded-full"></span>
                      <span className="absolute -inset-1 bg-primary/10 rounded-md blur-sm -z-10"></span>
                    </>
                  )}
                </Link>
              ))}
            </div>
          </nav>
          
          {/* Right side actions */}
          <div className="flex items-center justify-end space-x-3 w-1/4 ml-auto">
            {/* Desktop Search */}
            <div className="hidden md:flex relative items-center">
              <form onSubmit={handleDirectSearch} className="relative group">
                <Input
                  type="search"
                  placeholder="Search samples..."
                  className="w-[180px] lg:w-[240px] h-9 bg-black/40 border-zinc-800/60 focus-visible:ring-primary/40 rounded-full transition-all duration-300 pr-9 group-hover:bg-black/60 group-hover:border-zinc-700/70"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors duration-200"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>
            
            {/* Mobile search button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors duration-200"
              onClick={() => setSearchDialogOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
            
            {/* Cart */}
            <Link href="/cart">
              <Button 
                variant="ghost" 
                size="icon-sm"
                className="relative text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
              >
                <ShoppingCart className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center animate-pulse-subtle">
                    {count}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
            
            {/* Auth actions */}
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    className="overflow-hidden rounded-full hover:bg-zinc-800/50 transition-all duration-200 border border-transparent hover:border-zinc-700/50"
                  >
                    {session.user.image ? (
                      <img 
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-zinc-400" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-black/90 backdrop-blur-xl border-zinc-800/80 shadow-xl shadow-black/20 animate-in slide-in-from-top-5 duration-200">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{session.user.name || "User"}</p>
                      <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800/80" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/library" className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200">
                        My Library
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-zinc-800/80" />
                  <DropdownMenuItem 
                    className="text-primary focus:text-white cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200"
                    onClick={() => signOut()}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <AuthButton />
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent 
          side="right" 
          className="w-full max-w-xs bg-black/95 backdrop-blur-xl border-zinc-800/60 shadow-xl p-0"
        >
          <SheetHeader className="h-16 px-4 flex items-center border-b border-zinc-800/40">
            <div className="flex items-center justify-between w-full">
              <Logo variant="icon" color="red" size="xs" />
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-zinc-400 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto max-h-[90vh] py-2">
            <div className="px-4 py-3">
              <form onSubmit={handleDirectSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search samples..."
                  className="w-full bg-black/40 border-zinc-800/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>
            
            <nav className="px-2 mt-2">
              {FILTERED_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center w-full px-2 py-2 text-base rounded-md",
                    isPathActive(link.href)
                      ? "text-primary bg-primary/5"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            <div className="px-2 mt-4 pt-4 border-t border-zinc-800/40">
              <Link
                href="/cart"
                className="flex justify-between items-center w-full px-2 py-2 text-base text-zinc-400 hover:text-white hover:bg-zinc-800/30 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Cart</span>
                {count > 0 && (
                  <span className="bg-primary text-white text-xs font-medium rounded-full px-2 py-0.5">
                    {count} items
                  </span>
                )}
              </Link>
            </div>
            
            {/* Mobile auth actions */}
            <div className="mt-auto px-4 py-4 border-t border-zinc-800/40">
              {session?.user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {session.user.image ? (
                      <img 
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-zinc-800/80 flex items-center justify-center">
                        <User className="h-4 w-4 text-zinc-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full border-zinc-800 text-white hover:bg-zinc-800/80"
                      onClick={() => {
                        router.push('/dashboard')
                        setMobileMenuOpen(false)
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => signOut()}
                    >
                      Sign out
                    </Button>
                  </div>
                </div>
              ) : (
                <MobileAuthButton />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Search dialog for mobile */}
      <SearchDialog 
        open={searchDialogOpen} 
        onOpenChange={setSearchDialogOpen} 
      />
    </>
  )
}

