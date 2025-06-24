"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"

interface CartItem {
  id: string
  price: number
  format: "WAV" | "STEMS" | "MIDI"
  quantity: number
  sampleId: string | null
  samplePackId: number | null
  samplePack?: {
    id: number | string
    title: string
    price: number
    coverImage: string | null
  } | null
  sample?: {
    id: string
    title: string
    wavPrice: number | null
    stemsPrice: number | null
    midiPrice: number | null
    coverImage: string | null
    samplePack?: {
      title: string
    } | null
  } | null
}

export default function CartPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Redirect if not logged in
  if (status === "unauthenticated") {
    redirect("/login")
  }

  useEffect(() => {
    fetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchCart() {
    try {
      const response = await fetch("/api/cart")
      if (!response.ok) throw new Error("Failed to fetch cart")
      const data = await response.json()
      setItems(data.items)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load cart items",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function removeItem(itemId: string) {
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to remove item")

      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      })

      // Refresh cart
      fetchCart()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item",
      })
    }
  }

  const total = items.reduce((sum, item) => {
    return sum + (item.price || 0) * item.quantity
  }, 0)

  if (isLoading) {
    return <div className="container py-10">Loading...</div>
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button className="mt-4" asChild>
                <a href="/samples">Browse Samples</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-accent rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            item.samplePack?.coverImage || 
                            item.sample?.coverImage || 
                            "/images/placeholder-cover.jpg"
                          }
                          alt={item.sample?.title || item.samplePack?.title || "Sample"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {item.sample?.title || item.samplePack?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.format && (
                            <span className="mr-2">{item.format}</span>
                          )}
                          {formatPrice(item.price || 0)}
                        </p>
                        {item.sample && item.samplePack && (
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {item.samplePack.title}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove item</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex justify-between pt-6">
                <div className="text-lg font-medium">Total</div>
                <div className="text-lg font-medium">
                  {formatPrice(total)}
                </div>
              </CardFooter>
            </Card>

            <div className="flex justify-end">
              <Button size="lg" asChild>
                <a href="/checkout">Proceed to Checkout</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
