'use client'

import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { Navbar } from '@/components/layout/Navbar'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { DriverDashboard } from '@/components/driver/DriverDashboard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <DriverDashboard />
        )}
      </main>
    </div>
  )
}