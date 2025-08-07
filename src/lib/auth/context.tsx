'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabaseClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        console.log('AuthProvider: Getting initial session...')
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        )
        
        const sessionPromise = supabaseClient.auth.getSession()
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (isMounted) {
          setUser(session?.user ?? null)
          setLoading(false)
          console.log('AuthProvider: Session loaded successfully')
        }
      } catch (error) {
        console.error('AuthProvider: Session loading failed:', error)
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed:', event)
      if (isMounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Attempting sign in...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout')), 10000)
      )
      
      const signInPromise = supabaseClient.auth.signInWithPassword({
        email,
        password,
      })
      
      const { error } = await Promise.race([signInPromise, timeoutPromise]) as any

      if (error) {
        console.error('AuthProvider: Sign in error:', error.message)
        return { error: error.message }
      }

      console.log('AuthProvider: Sign in successful')
      return {}
    } catch (error) {
      console.error('AuthProvider: Sign in failed:', error)
      return { error: error instanceof Error ? error.message : 'Sign in failed' }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Attempting sign up...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign up timeout')), 10000)
      )
      
      const signUpPromise = supabaseClient.auth.signUp({
        email,
        password,
      })
      
      const { error } = await Promise.race([signUpPromise, timeoutPromise]) as any

      if (error) {
        console.error('AuthProvider: Sign up error:', error.message)
        return { error: error.message }
      }

      console.log('AuthProvider: Sign up successful')
      return {}
    } catch (error) {
      console.error('AuthProvider: Sign up failed:', error)
      return { error: error instanceof Error ? error.message : 'Sign up failed' }
    }
  }

  const signOut = async () => {
    await supabaseClient.auth.signOut()
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

