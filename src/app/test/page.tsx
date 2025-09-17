'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

export default function TestPage() {
  const { user, loading } = useAuth()
  const [session, setSession] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    getSession()

    const getUsers = async () => {
      const { data } = await supabase.from('users').select('*')
      setUsers(data || [])
    }
    getUsers()
  }, [])

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth Context</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm">
              {JSON.stringify({ user, loading }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Session</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Database Users</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm">
              {JSON.stringify(users, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}