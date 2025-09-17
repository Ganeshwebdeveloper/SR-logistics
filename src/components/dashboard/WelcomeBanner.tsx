'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, CarFront, Calendar, BarChart3 } from 'lucide-react'

export function WelcomeBanner() {
  const { user } = useAuth()

  const getWelcomeMessage = () => {
    if (user?.role === 'admin') {
      return {
        title: 'Administrator Dashboard',
        description: 'Manage your fleet, assign trips, and monitor driver activities',
        icon: <Shield className="h-8 w-8 text-blue-600" />,
        bgColor: 'bg-blue-50 border-blue-200'
      }
    }
    return {
      title: 'Driver Dashboard',
      description: 'View your assigned trips, track your progress, and manage your schedule',
      icon: <CarFront className="h-8 w-8 text-green-600" />,
      bgColor: 'bg-green-50 border-green-200'
    }
  }

  const welcome = getWelcomeMessage()

  return (
    <Card className={`border-2 ${welcome.bgColor}`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {welcome.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{welcome.title}</h2>
            <p className="text-gray-600 mt-1">{welcome.description}</p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                <span>Ready to get started</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}