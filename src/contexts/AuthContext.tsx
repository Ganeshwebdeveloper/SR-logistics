'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import { useRouter } from 'next/navigation'
import { debug } from '@/lib/debug'
import { ensureUserProfileExists } from '@/lib/user-utils'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    debug.log('AuthProvider mounted')
    
    const initializeAuth = async () => {
      debug.log('Initializing auth...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        debug.error('Error getting session:', error)
        setLoading(false)
        return
      }

      debug.log('Session data:', session)
      
      if (session?.user) {
        debug.log('User found in session:', session.user.id)
        await handleUserSession(session.user.id)
      } else {
        debug.log('No user session found')
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debug.log('Auth state changed:', event, session?.user?.id)
        
        if (session?.user) {
          await handleUserSession(session.user.id)
        } else {
          debug.log('User signed out')
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleUserSession = async (userId: string) => {
    try {
      debug.log('Handling user session for:', userId)
      
      // Ensure user profile exists
      const userProfile = await ensureUserProfileExists(userId)
      
      debug.log('User profile:', userProfile)
      setUser(userProfile)
      setLoading(false)
      
      // Redirect based on role
      if (userProfile.role === 'admin') {
        debug.log('Redirecting to admin dashboard')
        router.push('/admin')
      } else {
        debug.log('Redirecting to driver dashboard')
        router.push('/driver')
      }
    } catch (error) {
      debug.error('Error handling user session:', error)
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    debug.log('Signing in with email:', email)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      debug.error('Sign in error:', error)
      throw error
    }
    debug.log('Sign in successful')
  }

  const signOut = async () => {
    debug.log('Signing out')
    const { error } = await supabase.auth.signOut()
    if (error) {
      debug.error('Sign out error:', error)
      throw error
    }
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}