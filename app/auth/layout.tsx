import { ReactNode } from "react"

// Layout component for authentication pages
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo section */}
        <div className="flex justify-center mb-8">
          <h1 className="text-2xl font-bold">StealMySample</h1>
        </div>
        
        {/* Auth form container */}
        <div className="bg-card rounded-lg shadow-lg p-6">
          {children}
        </div>
      </div>
    </div>
  )
} 