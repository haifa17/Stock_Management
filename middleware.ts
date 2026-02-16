import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

// Routes that require authentication (any logged-in user can access)
const PROTECTED_ROUTES = [
  '/dashboard',
  '/inventory',
  '/warehouse',
  '/settings',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page and assets
  if (
    pathname === '/' || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/auth/login')
  ) {
    return NextResponse.next()
  }

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get the token
  const token = request.cookies.get('auth-token')

  if (!token) {
    // No token, redirect to login
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    // Verify token - we just check if it's valid, don't care about role
    await jwtVerify(token.value, SECRET_KEY)
    
    // Token is valid, allow access to any protected route
    return NextResponse.next()
  } catch (error) {
    // Invalid token, redirect to login
    console.error('Invalid token:', error)
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('auth-token')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}