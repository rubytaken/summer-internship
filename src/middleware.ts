import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('Middleware running for:', req.nextUrl.pathname)
  
  try {
    const res = NextResponse.next()
    
    // Skip auth check for certain paths
    const publicPaths = ['/', '/test', '/api', '/_next', '/favicon.ico']
    const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))
    
    if (isPublicPath) {
      return res
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: {
            getItem: (key: string) => {
              return req.cookies.get(key)?.value
            },
            setItem: (key: string, value: string) => {
              res.cookies.set(key, value)
            },
            removeItem: (key: string) => {
              res.cookies.delete(key)
            },
          },
        },
      }
    )

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Middleware timeout')), 3000)
    )
    
    const sessionPromise = supabase.auth.getSession()
    
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any

    // Protected routes - require authentication
    const protectedRoutes = ['/diagram', '/report', '/dashboard']
    const isProtectedRoute = protectedRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    )

    // If user is not signed in and trying to access a protected route
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL('/signin', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and trying to access auth pages, redirect to diagram
    if (session && (req.nextUrl.pathname === '/signin' || req.nextUrl.pathname === '/signup')) {
      const redirectUrl = new URL('/diagram', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // If middleware fails, just continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

