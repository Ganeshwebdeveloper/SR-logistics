'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, User, Car, MapPin, Shield, CarFront } from 'lucide-react'
import { toast } from 'sonner'

export function Navbar() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error('Error signing out')
    }
  }

  const getRoleIcon = () => {
    if (user?.role === 'admin') {
      return <Shield className="h-4 w-4 text-blue-600" />
    }
    return <CarFront className="h-4 w-4 text-green-600" />
  }

  const getRoleColor = () => {
    if (user?.role === 'admin') {
      return 'bg-blue-100 text-blue-800'
    }
    return 'bg-green-100 text-green-800'
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-blue-600" />
            <div>
              <span className="text-xl font-bold text-gray-900">FleetManager</span>
              <p className="text-xs text-gray-500">Professional Fleet Management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="font-medium">{user?.name}</span>
                <div className="flex items-center space-x-1">
                  {getRoleIcon()}
                  <span className={`px-2 py-1 ${getRoleColor()} text-xs font-medium rounded-full`}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}