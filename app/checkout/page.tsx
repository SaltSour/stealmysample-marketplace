"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { ShoppingCart, CreditCard, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { StripeCheckoutButton } from "@/components/checkout/stripe-checkout-button"

interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
  format: string
  coverImage?: string | null
  samplePackId?: string
  sampleId?: string
}

interface CartSummary {
  subtotal: number
  total: number
  items: CartItem[]
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [summary, setSummary] = useState<CartSummary>({
    subtotal: 0,
    total: 0,
    items: [],
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Only redirect if we're certain the user is not authenticated
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    // Only fetch summary if user is authenticated
    if (status === 'authenticated') {
      fetchSummary()
    }
  }, [status, router])

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/checkout/summary")
      if (!response.ok) throw new Error("Failed to fetch checkout summary")
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error("Error fetching checkout summary:", error)
      toast.error("Failed to load checkout summary")
    }
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 animate-pulse text-primary" />
          </div>
        </Card>
      </div>
    )
  }

  // Don't show anything if not authenticated
  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
            {summary.items.length > 0 ? (
              summary.items.map((item) => (
                item.samplePackId ? (
                  <Link
                    key={item.id}
                    href={`/packs/${item.samplePackId}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 py-4 group hover:bg-accent/50 rounded-lg px-4 transition-colors cursor-pointer">
                      {item.coverImage && (
                        <div className="relative w-20 h-20">
                          <Image
                            src={item.coverImage}
                            alt={item.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                        </div>
                        <p className="text-sm text-gray-500">
                          Format: {item.format} ÔÇó Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  </Link>
                ) : item.sampleId ? (
                  <Link
                    key={item.id}
                    href={`/samples/${item.sampleId}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 py-4 group hover:bg-accent/50 rounded-lg px-4 transition-colors cursor-pointer">
                      {item.coverImage && (
                        <div className="relative w-20 h-20">
                          <Image
                            src={item.coverImage}
                            alt={item.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                        </div>
                        <p className="text-sm text-gray-500">
                          Format: {item.format} ÔÇó Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div key={item.id} className="flex items-center gap-4 py-4 px-4">
                    {item.coverImage && (
                      <div className="relative w-20 h-20">
                        <Image
                          src={item.coverImage}
                          alt={item.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-500">
                        Format: {item.format} ÔÇó Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                )
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-4 opacity-50" />
                <p>Your cart is empty</p>
              </div>
            )}
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(summary.total)}</span>
              </div>
              <StripeCheckoutButton 
                className="w-full"
                disabled={summary.items.length === 0}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 
