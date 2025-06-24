"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TestPurchase() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()
  
  const createTestPurchase = async (simple = true) => {
    setIsLoading(true)
    try {
      // Use the simpler endpoint that avoids format issues
      const endpoint = simple ? '/api/debug/test-purchase-simple' : '/api/debug/test-purchase';
      
      const response = await fetch(endpoint, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test purchase')
      }
      
      setResult(data)
      toast({
        title: "Test purchase created",
        description: `Created order #${data.order?.id} with ${data.verifyOrderItemsCount} items`
      })
    } catch (error) {
      console.error('Error creating test purchase:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const runDiagnostics = async (createOrder = false) => {
    setIsLoading(true)
    try {
      const url = createOrder 
        ? '/api/debug/test-simple?createOrder=true'
        : '/api/debug/test-simple';
        
      const response = await fetch(url)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Diagnostics failed')
      }
      
      setDiagnosticResult(data)
      toast({
        title: "Diagnostics complete",
        description: "Check the results below"
      })
    } catch (error) {
      console.error('Error running diagnostics:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const goToLibrary = () => {
    router.push('/dashboard/library')
  }
  
  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug: Library Tests</CardTitle>
          <CardDescription>
            Diagnose and fix issues with your library not showing purchases
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="purchase">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="purchase" className="flex-1">Create Test Purchase</TabsTrigger>
            <TabsTrigger value="diagnose" className="flex-1">Run Diagnostics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="purchase">
            <CardContent>
              <p className="text-amber-600 mb-4 bg-amber-50 p-3 rounded border border-amber-200">
                This will create a test purchase with a sample pack in your account for debugging.
              </p>
              
              {result && (
                <div className="mt-4 bg-slate-50 p-4 rounded border border-slate-200 overflow-auto max-h-64">
                  <h3 className="font-medium mb-2">Test purchase created successfully:</h3>
                  <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between gap-2">
              <Button 
                onClick={() => createTestPurchase(true)} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Simple Purchase (No Format)'}
              </Button>
              
              {result && (
                <Button 
                  variant="outline" 
                  onClick={goToLibrary}
                  className="whitespace-nowrap"
                >
                  Go to Library
                </Button>
              )}
            </CardFooter>
          </TabsContent>
          
          <TabsContent value="diagnose">
            <CardContent>
              <p className="text-blue-600 mb-4 bg-blue-50 p-3 rounded border border-blue-200">
                Run diagnostics to check each step of the purchase process. This helps identify exactly where problems occur.
              </p>
              
              {diagnosticResult && (
                <div className="mt-4 bg-slate-50 p-4 rounded border border-slate-200 overflow-auto max-h-64">
                  <h3 className="font-medium mb-2">Diagnostic results:</h3>
                  <pre className="text-xs">{JSON.stringify(diagnosticResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between gap-2">
              <Button 
                onClick={() => runDiagnostics(false)} 
                disabled={isLoading}
                variant="secondary"
                className="flex-1"
              >
                {isLoading ? 'Running...' : 'Basic Diagnostics (No Order)'}
              </Button>
              
              <Button 
                onClick={() => runDiagnostics(true)} 
                disabled={isLoading}
                variant="secondary"
                className="flex-1"
              >
                {isLoading ? 'Running...' : 'Full Diagnostics (With Order)'}
              </Button>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
} 