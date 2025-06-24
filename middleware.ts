import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname === "/login" || pathname === "/register"
  const isApiRoute = pathname.startsWith("/api")

  // Redirect authenticated users away from auth pages
  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Handle public routes - only redirect to login if trying to access protected routes
  if (!isAuth && !isAuthPage && !isApiRoute) {
    const protectedPaths = [
      "/dashboard",
      "/profile",
      "/become-creator"
    ]
    
    if (protectedPaths.some(path => pathname.startsWith(path))) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Role-based access control for authenticated users
  if (isAuth && token) {
    const userRole = token.role as string | undefined
    const isCreator = token.isCreator as boolean | undefined

    // Creator-only features in dashboard
    if (pathname.startsWith("/dashboard/upload") || 
        pathname.startsWith("/dashboard/analytics")) {
      if (!isCreator && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Admin-only routes
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Protected routes
  const protectedPaths = [
    "/api/upload",
    "/api/packs",
    "/dashboard"
  ]

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(prefix => 
    pathname.startsWith(prefix)
  )

  if (isProtectedPath) {
    // Redirect to login if no token is found
    if (!token) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    // Check if user has required role for upload route
    if (pathname.startsWith("/api/upload")) {
      const isCreator = token.isCreator === true
      const isAdmin = token.role === "ADMIN"

      if (!isCreator && !isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
    }
  }

  return NextResponse.next()
}

// Extend the JWT type to include our custom fields
declare module "next-auth/jwt" {
  interface JWT {
    isCreator?: boolean
    role?: string
  }
}

// Specify which routes should be protected
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/become-creator",
    "/login",
    "/register",
    "/api/upload/:path*",
    "/api/packs/:path*",
  ],
} 