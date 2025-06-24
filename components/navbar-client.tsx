"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, Search, X, User, LayoutDashboard, Download, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Session } from "next-auth";

// --- Reusable Sub-components ---

const Logo = () => (
    <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <Image 
            src="/images/logo-gradient.png" 
            alt="Steal My Sample" 
            width={50} 
            height={50} 
            className="rounded-full animate-pulse-subtle hover:shadow-glow transition-all duration-300" 
        />
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
            StealMySample
        </span>
    </Link>
);

const NavLinks = ({ isCreator, onLinkClick }) => (
    <div className="hidden md:flex items-center space-x-4 ml-10">
        <Link href="/" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium" onClick={onLinkClick}>Home</Link>
        <Link href="/packs" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium" onClick={onLinkClick}>Sample Packs</Link>
        {isCreator && (
            <Link href="/dashboard" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium" onClick={onLinkClick}>Dashboard</Link>
        )}
        <Link href="/pricing" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium" onClick={onLinkClick}>Pricing</Link>
    </div>
);

const SearchBar = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <form className="relative hidden md:block" onSubmit={handleSearch}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search..."
                className="w-60 pl-8 bg-background/50 border-accent/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </form>
    );
};

const UserMenu = ({ session, isCreator }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                {session?.user?.image ? (
                    <Image src={session.user.image} alt="User" layout="fill" className="rounded-full" />
                ) : (
                    <User className="h-5 w-5" />
                )}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/account"><User className="mr-2 h-4 w-4" />Account</Link></DropdownMenuItem>
            {isCreator && <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></DropdownMenuItem>}
            <DropdownMenuItem asChild><Link href="/downloads"><Download className="mr-2 h-4 w-4" />Downloads</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const AuthButtons = () => (
    <div className="hidden md:flex items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/login">Log In</Link></Button>
        <Button asChild size="sm"><Link href="/register">Sign Up</Link></Button>
    </div>
);

const MobileMenu = ({ isOpen, onLinkClick, isCreator, session }) => (
    <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium" onClick={onLinkClick}>Home</Link>
            <Link href="/packs" className="block px-3 py-2 rounded-md text-base font-medium" onClick={onLinkClick}>Sample Packs</Link>
            {isCreator && (
                <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium" onClick={onLinkClick}>Dashboard</Link>
            )}
            <Link href="/pricing" className="block px-3 py-2 rounded-md text-base font-medium" onClick={onLinkClick}>Pricing</Link>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-700">
            {session ? (
                <div className="px-5">
                    <div className="flex items-center">
                        {session.user.image ? (
                            <Image src={session.user.image} alt="User" width={40} height={40} className="rounded-full" />
                        ) : (
                            <User className="h-8 w-8 rounded-full bg-gray-700 p-1"/>
                        )}
                        <div className="ml-3">
                            <p className="text-base font-medium">{session.user.name}</p>
                            <p className="text-sm text-muted-foreground">{session.user.email}</p>
                        </div>
                    </div>
                    <div className="mt-3 space-y-1">
                        <Link href="/account" className="block px-3 py-2 rounded-md text-base font-medium" onClick={onLinkClick}>Account</Link>
                        <Link href="/downloads" className="block px-3 py-2 rounded-md text-base font-medium" onClick={onLinkClick}>Downloads</Link>
                        <button onClick={() => { signOut(); onLinkClick(); }} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium">Log out</button>
                    </div>
                </div>
            ) : (
                <div className="px-5 space-y-2">
                    <Button asChild variant="outline" className="w-full"><Link href="/login" onClick={onLinkClick}>Log In</Link></Button>
                    <Button asChild className="w-full"><Link href="/register" onClick={onLinkClick}>Sign Up</Link></Button>
                </div>
            )}
        </div>
    </div>
);


// --- Main Client Component ---

const NavbarClient = ({ session }: { session: Session | null }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isCreator = useMemo(() => session?.user?.isCreator, [session]);
  
    return (
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-accent/10 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Logo />
              <NavLinks isCreator={isCreator} onLinkClick={() => setIsMobileMenuOpen(false)} />
            </div>
            <div className="hidden md:flex items-center space-x-4">
                <SearchBar />
                {session ? <UserMenu session={session} isCreator={isCreator} /> : <AuthButtons />}
            </div>
            <div className="md:hidden flex items-center">
                <button onClick={() => setIsMobileMenuOpen(o => !o)} aria-label="Open menu">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>
          </div>
        </div>
        <MobileMenu isOpen={isMobileMenuOpen} onLinkClick={() => setIsMobileMenuOpen(false)} isCreator={isCreator} session={session} />
      </nav>
    );
  };
  
  export default NavbarClient; 