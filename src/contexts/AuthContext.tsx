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
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // Try to get user profile from public.users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        // If user profile doesn't exist yet, create a minimal one
        await createMinimalUserProfile(userId)
        return
      }
      
      setUser(userData)
      // Redirect based on role
      if (userData.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/driver')
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }

  const createMinimalUserProfile = async (userId: string) => {
    try {
      // Get user data from auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        console.error('Error getting auth user:', authError)
        return
      }
      
      // Create minimal user profile
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: authUser.user_metadata?.role || 'driver'
          }
        ])
        .select()
        .single()
      
      if (insertError) {
        console.error('Error creating user profile:', insertError)
        return
      }
      
      setUser(newUser)
      // Redirect based on role
      if (newUser.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/driver')
      }
    } catch (error) {
      console.error('Error in createMinimalUserProfile:', error)
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