import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

// Routes protégées par rôle
const PROTECTED_ROUTES = {
  admin: ['/dashboard', '/inventory'],
  warehouseStaff: ['/warehouse', '/inventory'],
  all: ['/dashboard', '/inventory', '/warehouse'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permettre l'accès à la page de login et aux assets
  if (pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/api/auth/login')) {
    return NextResponse.next()
  }

  // Vérifier si la route est protégée
  const isProtectedRoute = PROTECTED_ROUTES.all.some(route => 
    pathname.startsWith(route)
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Récupérer le token
  const token = request.cookies.get('auth-token')

  if (!token) {
    // Pas de token, rediriger vers login
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    // Vérifier le token
    const { payload } = await jwtVerify(token.value, SECRET_KEY)
    const userRole = payload.role as string

    // Vérifier les permissions selon la route
    if (pathname.startsWith('/dashboard')) {
      if (userRole !== 'admin') {
        // Rediriger vers warehouse si pas admin
        return NextResponse.redirect(new URL('/warehouse', request.url))
      }
    }

    if (pathname.startsWith('/warehouse')) {
      if (userRole !== 'warehouseStaff' && userRole !== 'admin') {
        // Rediriger vers dashboard si admin
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    // Token invalide, rediriger vers login
    console.error('Token invalide:', error)
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