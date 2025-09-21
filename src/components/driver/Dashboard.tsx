'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Navigation, MapPin, Clock, CheckCircle, XCircle, Play, Stop } from 'lucide-react'
import { Trip } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { GPSTracker } from './GPSTracker'

interface DriverDashboardProps {
  driverId: string
}

export function DriverDashboard({ driverId }: DriverDashboardProps) {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(false)

  const fetchActiveTrip = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          driver:driver_id(*),
          vehicle:vehicle_id(*)
        `)
        .eq('driver_id', driverId)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 means no rows found

      setActiveTrip(data || null)
    } catch (error: any) {
      toast.error(error.message || 'Error fetching trip data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveTrip()

    // Set up real-time subscription for trip updates
    const channel = supabase
      .channel('trip-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          setActiveTrip(payload.new as Trip)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [driverId])

  const handleStartTrip = async () => {
    if (!activeTrip) return

    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'in_progress',
          start_time: new Date().toISOString()
        })
        .eq('id', activeTrip.id)

      if (error) throw error

      // Also update driver status
      const { error: driverError } = await supabase
        .from('users')
        .update({ status: 'on_trip' })
        .eq('id', driverId)

      if (driverError) throw driverError

      toast.success('Trip started successfully')
      setIsTracking(true)
    } catch (error: any) {
      toast.error(error.message || 'Error starting trip')
    }
  }

  const handleCompleteTrip = async () => {
    if (!activeTrip) return

    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', activeTrip.id)

      if (error) throw error

      // Also update driver status
      const { error: driverError } = await supabase
        .from('users')
        .update({ status: 'available' })
        .eq('id', driverId)

      if (driverError) throw driverError

      toast.success('Trip completed successfully')
      setIsTracking(false)
    } catch (error: any) {
      toast.error(error.message || 'Error completing trip')
    }
  }

  const handleCancelTrip = async () => {
    if (!activeTrip) return

    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'cancelled',
          end_time: new Date().toISOString()
        })
        .eq('id', activeTrip.id)

      if (error) throw error

      // Also update driver status
      const { error: driverError } = await supabase
        .from('users')
        .update({ status: 'available' })
        .eq('id', driverId)

      if (driverError) throw driverError

      toast.success('Trip cancelled')
      setIsTracking(false)
    } catch (error: any) {
      toast.error(error.message || 'Error cancelling trip')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Driver Dashboard</h1>
        <p className="text-gray-500">Manage your trips and availability</p>
      </div>

      {activeTrip ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Trip</CardTitle>
              {getStatusBadge(activeTrip.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Route
                </h3>
                <p className="text-sm">
                  <span className="font-medium">{activeTrip.start_location}</span> to{' '}
                  <span className="font-medium">{activeTrip.end_location}</span>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </h3>
                <p className="text-sm">
                  Start: {new Date(activeTrip.start_time).toLocaleString()}
                </p>
                {activeTrip.end_time && (
                  <p className="text-sm">
                    End: {new Date(activeTrip.end_time).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  Vehicle
                </h3>
                <p className="text-sm">
                  {activeTrip.vehicle?.make} {activeTrip.vehicle?.model} (
                  {activeTrip.vehicle?.license_plate})
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Driver
                </h3>
                <p className="text-sm">{activeTrip.driver?.name}</p>
              </div>
            </div>

            <Separator />

            {activeTrip.status === 'pending' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleStartTrip} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Start Trip
                </Button>
                <Button variant="outline" onClick={handleCancelTrip} className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Trip
                </Button>
              </div>
            )}

            {activeTrip.status === 'in_progress' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleCompleteTrip} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Trip
                </Button>
                <Button variant="outline" onClick={handleCancelTrip} className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Trip
                </Button>
              </div>
            )}

            {activeTrip.status === 'in_progress' && (
              <GPSTracker 
                tripId={activeTrip.id} 
                onLocationUpdate={(lat, lng) => {
                  // Update the local trip data with new location
                  setActiveTrip(prev => prev ? {
                    ...prev,
                    current_lat: lat,
                    current_lng: lng,
                    updated_at: new Date().toISOString()
                  } : null)
                }}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Navigation className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">No Active Trips</h3>
            <p className="text-gray-500 text-center">
              You don't have any assigned trips at the moment.
              <br />
              Check back later or contact your administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}