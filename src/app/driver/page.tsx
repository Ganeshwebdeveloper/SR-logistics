'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DriverDashboard } from '@/components/driver/DriverDashboard'
import { Navbar } from '@/components/layout/Navbar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function DriverPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    } else if (user && user.role === 'admin') {
      router.push('/admin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <DriverDashboard />
      </main>
    </div>
  )
}