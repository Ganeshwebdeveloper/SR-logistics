'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SignupTest() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTestSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'driver'
          }
        }
      })

      if (error) throw error

      toast.success('Test signup successful! Check if user profile was created.')
      
      // Check if user profile exists after a short delay
      setTimeout(async () => {
        if (data.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (userData) {
            toast.success('User profile created successfully!')
            console.log('User profile:', userData)
          } else {
            toast.warning('User profile not found - trigger may not be working')
          }
        }
      }, 2000)

    } catch (error: any) {
      toast.error(error.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Signup</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTestSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 chars)"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Testing...' : 'Test Signup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}