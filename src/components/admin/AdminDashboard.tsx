'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Car, Navigation, Calendar, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import { DashboardStats } from './DashboardStats'
import { RecentTrips } from './RecentTrips'
import { VehiclesTable } from './VehiclesTable'
import { DriversTable } from './DriversTable'
import { LiveMap } from './LiveMap'
import { supabase } from '@/lib/supabase'
import { Trip, Vehicle, User } from '@/types'
import { toast } from 'sonner'

export function AdminDashboard() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch trips with related data
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          driver:driver_id(*),
          vehicle:vehicle_id(*)
        `)
        .order('created_at', { ascending: false })

      if (tripsError) throw tripsError

      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (vehiclesError) throw vehiclesError

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      setTrips(tripsData || [])
      setVehicles(vehiclesData || [])
      setUsers(usersData || [])
    } catch (error: any) {
      toast.error(error.message || 'Error fetching data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up real-time subscription for trip updates
    const tripChannel = supabase
      .channel('trip-location-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
        },
        (payload) => {
          // Update the specific trip in our state
          setTrips(prev => prev.map(trip => 
            trip.id === payload.new.id ? { ...trip, ...payload.new } : trip
          ))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trips',
        },
        (payload) => {
          // Add new trip to our state
          setTrips(prev => [payload.new as Trip, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tripChannel)
    }
  }, [])

  const handleRefresh = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const activeTrips = trips.filter(trip => trip.status === 'in_progress')
  const availableVehicles = vehicles.filter(vehicle => vehicle.status === 'available')
  const availableDrivers = users.filter(user => user.status === 'available')
  const drivers = users.filter(user => user.role === 'driver')
  const activeDrivers = users.filter(user => user.status === 'on_trip')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </Button>
      </div>

      <DashboardStats 
        trips={trips}
        vehicles={vehicles}
        users={users}
        activeTrips={activeTrips}
        availableVehicles={availableVehicles}
        activeDrivers={activeDrivers}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveMap trips={trips} onRefresh={handleRefresh} />
        <RecentTrips 
          trips={trips} 
          drivers={drivers}
          vehicles={vehicles}
          onRefresh={handleRefresh} 
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <DriversTable drivers={drivers} onRefresh={handleRefresh} />
        <VehiclesTable vehicles={vehicles} onRefresh={handleRefresh} />
      </div>
    </div>
  )
}