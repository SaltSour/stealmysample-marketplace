"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft, ShoppingCart } from "lucide-react"

export default function CheckoutCancelPage() {
  return (
    <div className="container max-w-3xl mx-auto py-16 px-4">
      <Card className="overflow-hidden">
        <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-center justify-center">
          <AlertTriangle className="h-20 w-20 text-amber-500" />
        </div>
        
        <CardHeader>
          <CardTitle className="text-center text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-center text-zinc-600">
            Your payment process was cancelled. No charges have been made and your items remain in your cart.
          </p>
          
          <div className="border rounded-lg p-4 bg-zinc-50">
            <h3 className="font-medium mb-2">What happens next?</h3>
            <ul className="list-disc pl-5 text-sm text-zinc-600 space-y-1">
              <li>Your cart items are still saved</li>
              <li>You can return to checkout at any time</li>
              <li>No charges have been processed</li>
              <li>Your saved samples will remain in your cart until you complete your purchase</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild>
            <Link href="/checkout">
              <ShoppingCart className="mr-2 h-4 w-4" /> Return to Checkout
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/samples">
              <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 
