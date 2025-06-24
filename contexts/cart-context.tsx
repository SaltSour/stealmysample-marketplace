"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

// Types
interface CartItem {
  id: string
  quantity: number
  samplePack: {
    id: string
    title: string
    price: number
    coverImage: string
  }
}

interface Cart {
  id: string
  items: CartItem[]
}

interface AddToCartParams {
  samplePackId: string
  price: number
  format?: 'WAV' | 'STEMS' | 'MIDI'
}

interface CartContextType {
  cart: Cart | null
  loading: boolean
  error: string | null
  addToCart: (params: AddToCartParams) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined)

// Provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch cart data
  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart")
      if (!response.ok) throw new Error("Failed to fetch cart")
      const data = await response.json()
      setCart(data)
    } catch (err) {
      setError("Error fetching cart")
      console.error("Error fetching cart:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch cart on session change
  useEffect(() => {
    if (session) {
      fetchCart()
    } else {
      setCart(null)
      setLoading(false)
    }
  }, [session])

  // Add item to cart
  const addToCart = async ({ samplePackId, price, format = 'WAV' }: AddToCartParams) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samplePackId, price, format }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add item to cart")
      }
      
      await fetchCart() // Refresh cart data
      toast.success("Item added to cart")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add item to cart")
      console.error("Error adding item to cart:", err)
    }
  }

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to remove item from cart")
      
      await fetchCart() // Refresh cart data
      toast.success("Item removed from cart")
    } catch (err) {
      toast.error("Failed to remove item from cart")
      console.error("Error removing item from cart:", err)
    }
  }

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      })

      if (!response.ok) throw new Error("Failed to update quantity")
      
      await fetchCart() // Refresh cart data
      toast.success("Quantity updated")
    } catch (err) {
      toast.error("Failed to update quantity")
      console.error("Error updating quantity:", err)
    }
  }

  // Clear cart
  const clearCart = async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to clear cart")
      
      await fetchCart() // Refresh cart data
      toast.success("Cart cleared")
    } catch (err) {
      toast.error("Failed to clear cart")
      console.error("Error clearing cart:", err)
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
} 