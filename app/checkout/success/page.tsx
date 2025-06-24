"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Download, ShoppingCart, Package, Music, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Helper function to format price
function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

// Loading component to use in Suspense
function CheckoutSuccessLoading() {
  return (
    <div className="container max-w-3xl mx-auto py-16 px-4">
      <Card className="text-center p-8">
        <CardContent>
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="h-16 w-16 bg-green-200 rounded-full"></div>
            <div className="h-8 w-64 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-48 bg-gray-200 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main content component that uses useSearchParams
function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (sessionId) {
      fetchOrderDetails(sessionId)
    } else {
      setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    // Clear cart after successful checkout
    const clearCart = async () => {
      try {
        await fetch('/api/cart', {
          method: 'DELETE'
        });
        console.log("Cart cleared successfully");
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    }
    
    if (sessionId) {
      clearCart();
    }
  }, [sessionId]);

  const fetchOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/checkout/session?id=${id}`)
      if (!response.ok) throw new Error("Failed to fetch order details")
      
      const data = await response.json()
      setOrderDetails(data)
    } catch (error) {
      console.error("Error fetching order details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const goToLibrary = () => {
    setIsRedirecting(true);
    router.push("/dashboard/library");
  }

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-16 px-4">
        <Card className="text-center p-8">
          <CardContent>
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <div className="h-16 w-16 bg-green-200 rounded-full"></div>
              <div className="h-8 w-64 bg-gray-200 rounded-full"></div>
              <div className="h-4 w-48 bg-gray-200 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="container max-w-3xl mx-auto py-16 px-4">
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle className="text-red-500">Missing Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-600 mb-6">
              We couldn't find your order details. If you've completed a purchase, please check
              your email for confirmation.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/samples">Browse More Samples</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-16 px-4">
      <Card className="overflow-hidden">
        <div className="bg-green-50 p-6 border-b border-green-100 flex items-center justify-center">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        
        <CardHeader>
          <CardTitle className="text-center text-2xl">Thank You For Your Purchase!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-center text-zinc-600">
            Your order has been successfully processed. Your items are now available in your library.
          </p>
          
          <div className="border rounded-lg p-4 bg-zinc-50 mb-6">
            <h3 className="font-medium mb-2">Order Summary</h3>
            <div className="text-sm text-zinc-600">
              <p>Order ID: <span className="font-mono text-xs">{orderDetails?.id || (sessionId?.substring(0, 16) + '...')}</span></p>
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>Total: {orderDetails?.totalAmount ? formatPrice(orderDetails.totalAmount) : 'N/A'}</p>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-blue-50 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Confirmation Email Sent</h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>A purchase confirmation email with your download links has been sent to your registered email address.</p>
                </div>
              </div>
            </div>
          </div>

          {orderDetails?.items && orderDetails.items.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Purchased Items</h3>
              <div className="divide-y">
                {orderDetails.items.map((item: any) => (
                  <div key={item.id} className="py-3 flex items-center gap-3">
                    {item.type === 'pack' ? (
                      <Package className="h-8 w-8 text-primary" />
                    ) : (
                      <Music className="h-8 w-8 text-primary" />
                    )}
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type === 'pack' ? 'Sample Pack' : 'Individual Sample'} ÔÇó {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center">
              <Download className="mr-2 h-4 w-4" /> How to Access Your Purchase
            </h3>
            <ol className="list-decimal pl-5 text-sm text-blue-800 space-y-1">
              <li>Go to your Dashboard by clicking the button below</li>
              <li>Navigate to the "Library" section</li>
              <li>Your purchased items will be available for streaming and download</li>
              <li>For sample packs, you can access all included samples</li>
            </ol>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            asChild={!isRedirecting} 
            size="lg" 
            onClick={isRedirecting ? undefined : goToLibrary}
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <>
                <span className="animate-spin mr-2">ÔÅ│</span> Redirecting to Library...
              </>
            ) : (
              <Link href="/dashboard/library">
                <Download className="mr-2 h-4 w-4" /> Go to Your Library
              </Link>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/samples">
              <ShoppingCart className="mr-2 h-4 w-4" /> Continue Shopping
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Main page component with Suspense boundary
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
} 
