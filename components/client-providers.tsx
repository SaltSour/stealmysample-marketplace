"use client"

import { ReactNode } from "react"
import { SessionProvider, SessionProviderProps } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { QueryProvider } from "@/providers/query-provider"
import { CartProvider } from "@/contexts/cart-context"

interface ClientProvidersProps {
  children: ReactNode
  session: SessionProviderProps['session']
}

export default function ClientProviders({ children, session }: ClientProvidersProps) {
  return (
    <SessionProvider session={session}>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <CartProvider>
              {children}
              <Toaster />
          </CartProvider>
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  )
} 