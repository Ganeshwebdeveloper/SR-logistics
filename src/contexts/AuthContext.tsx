'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import { useRouter } from 'next/navigation'

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
    // Get initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // Try to get user profile with retry logic
      let retries = 0
      let userData: User | null = null
      
      while (retries < 3 && !userData) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.log('Retry', retries + 1, 'failed:', error.message)
          retries++
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
          continue
        }

        userData = data
      }

      if (!userData) {
        // If user profile still doesn't exist, create it
        await createUserProfile(userId)
        return
      }

      setUser(userData)
      setLoading(false)
      
      // Redirect based on role
      if (userData.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/driver')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setLoading(false)
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      // Get auth user data
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        throw new Error('No auth user found')
      }

      // Create user profile with default role as driver
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: authUser.email!,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: authUser.user_metadata?.role || 'driver'
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        return
      }

      setUser(newUser)
      setLoading(false)
      
      // Redirect based on role
      if (newUser.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/driver')
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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