import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone, Music, Headphones, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/logo"
import { FOOTER_LINKS } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="w-full bg-black/80 backdrop-blur-lg supports-[backdrop-filter]:bg-black/60 border-t border-zinc-800/40 relative mt-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-secondary/10 rounded-full blur-3xl opacity-20"></div>
      </div>
      
      <div className="container mx-auto max-w-7xl px-4 pt-8 pb-6 relative z-10">
        {/* Main Footer Content */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div>
            <Link href="/" className="block mb-4">
              <Logo variant="full" color="white" size="md" />
            </Link>
            <p className="text-sm text-zinc-400 mb-6 max-w-xs">
              Your marketplace for high-quality audio samples, beats, and more.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-zinc-500 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-instagram"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </Link>
              <Link
                href="#"
                className="text-zinc-500 hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-twitter"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-white">Features</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/samples" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors">
                  <Headphones className="h-4 w-4 text-primary" />
                  High-Quality Samples
                </Link>
              </li>
              <li>
                <Link href="/creators" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors">
                  <Music className="h-4 w-4 text-primary" />
                  Connect with Creators
                </Link>
              </li>
              <li>
                <Link href="/become-creator" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Sell Your Samples
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                  Creator Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-white">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-zinc-400 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-zinc-400 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-zinc-400 hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-sm text-zinc-400 hover:text-primary transition-colors">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-white">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/legal/terms" className="text-sm text-zinc-400 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-sm text-zinc-400 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-sm text-zinc-400 hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/licenses" className="text-sm text-zinc-400 hover:text-primary transition-colors">
                  Licensing
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Footer bottom bar */}
        <div className="mt-8 pt-6 border-t border-zinc-800/40">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-500">
              &copy; {new Date().getFullYear()} StealMySample. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Button variant="link" size="sm" className="text-xs text-zinc-500 hover:text-primary p-0 h-auto">
                Support
              </Button>
              <Separator orientation="vertical" className="h-3 bg-zinc-800" />
              <Button variant="link" size="sm" className="text-xs text-zinc-500 hover:text-primary p-0 h-auto">
                FAQ
              </Button>
              <Separator orientation="vertical" className="h-3 bg-zinc-800" />
              <Button variant="link" size="sm" className="text-xs text-zinc-500 hover:text-primary p-0 h-auto">
                Sitemap
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

