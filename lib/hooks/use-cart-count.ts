import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CartCountResult {
  count: number
  isLoading: boolean
}

export function useCartCount(): CartCountResult {
  const { data: session } = useSession()
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setCount(0)
      setIsLoading(false)
      return
    }

    const fetchCartCount = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/cart/items')
        if (!response.ok) throw new Error('Failed to fetch cart count')
        const data = await response.json()
        setCount(data.items?.length || 0)
      } catch (error) {
        console.error('Error fetching cart count:', error)
        setCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCartCount()
  }, [session?.user])

  return { count, isLoading }
} 