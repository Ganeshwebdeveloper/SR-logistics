'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function UserCheck() {
  const [userId, setUserId] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkUser = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      
      setUserData(data)
      toast.success('User found!')
    } catch (error: any) {
      toast.error(error.message || 'User not found')
      setUserData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Check User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>
          <Button onClick={checkUser} disabled={loading || !userId}>
            {loading ? 'Checking...' : 'Check User'}
          </Button>

          {userData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">User Profile:</h3>
              <pre className="text-sm">{JSON.stringify(userData, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}