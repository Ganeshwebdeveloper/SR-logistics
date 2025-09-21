'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Car, Navigation, TrendingUp } from 'lucide-react'
import { Trip, Vehicle, User } from '@/types'

interface DashboardStatsProps {
  trips: Trip[]
  vehicles: Vehicle[]
  users: User[]
  activeTrips: Trip[]
  availableVehicles: Vehicle[]
  activeDrivers: User[]
}

export function DashboardStats({ 
  trips, 
  vehicles, 
  users, 
  activeTrips, 
  availableVehicles, 
  activeDrivers 
}: DashboardStatsProps) {
  const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0)
  const completedTrips = trips.filter(trip => trip.status === 'completed').length
  const totalDrivers = users.filter(user => user.role === 'driver').length

  const stats = [
    {
      title: 'Total Trips',
      value: trips.length,
      icon: Navigation,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Trips',
      value: activeTrips.length,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Vehicles',
      value: vehicles.length,
      icon: Car,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Available Vehicles',
      value: availableVehicles.length,
      icon: Car,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Drivers',
      value: totalDrivers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Active Drivers',
      value: activeDrivers.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.title === 'Total Trips' && (
              <p className="text-xs text-muted-foreground">
                {completedTrips} completed • {totalDistance.toFixed(0)} km total
              </p>
            )}
            {stat.title === 'Total Vehicles' && (
              <p className="text-xs text-muted-foreground">
                {availableVehicles.length} available • {vehicles.length - availableVehicles.length} in use
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}