'use client'

import React, { useState, useEffect } from 'react'
import { Trip } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Car, Navigation, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CurrentTripProps {
  trip: Trip
  onComplete: () => void
}

export function CurrentTrip({ trip, onComplete }: CurrentTripProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distanceTraveled, setDistanceTraveled] = useState(0)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (trip.status === 'in_progress') {
      startGPSMonitoring()
      updateDriverStatus('on_trip')
    }
  }, [trip.status])

  const startGPSMonitoring = () => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation({ lat: latitude, lng: longitude })
          updateTripLocation(latitude, longitude)
        },
        (error) => {
          console.error('GPS error:', error)
          toast.error('Unable to access GPS location')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }

  const updateDriverStatus = async (status: 'available' | 'assigned' | 'on_trip') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', trip.driver_id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating driver status:', error)
    }
  }

  const updateTripLocation = async (lat: number, lng: number) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          current_lat: lat,
          current_lng: lng,
          updated_at: new Date().toISOString()
        })
        .eq('id', trip.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating trip location:', error)
    }
  }

  const updateDistance = async () => {
    setUpdating(true)
    try {
      // Simulate distance calculation (in real app, use proper distance formula)
      const newDistance = distanceTraveled + Math.random() * 5
      setDistanceTraveled(newDistance)

      const { error } = await supabase
        .from('trips')
        .update({ 
          distance: newDistance,
          updated_at: new Date().toISOString()
        })
        .eq('id', trip.id)

      if (error) throw error
      
      toast.success('Distance updated successfully')
    } catch (error) {
      toast.error('Error updating distance')
    } finally {
      setUpdating(false)
    }
  }

  const handleCompleteTrip = async () => {
    // Update driver status to available
    await updateDriverStatus('available')
    // Update vehicle status to available
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', trip.vehicle_id)
    
    onComplete()
  }

  const calculateProgress = () => {
    const totalDistance = trip.distance || 1
    return Math.min(Math.round((distanceTraveled / totalDistance) * 100), 100)
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <Navigation className="h-5 w-5 mr-2" />
          Active Trip
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium">From</p>
              <p className="text-lg font-semibold">{trip.start_location}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">To</p>
              <p className="text-lg font-semibold">{trip.end_location}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Car className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-sm font-medium">Vehicle</p>
              <p className="text-sm">
                {trip.vehicle?.make} {trip.vehicle?.model} ({trip.vehicle?.license_plate})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-sm font-medium">Started</p>
              <p className="text-sm">
                {new Date(trip.start_time).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <span className="font-medium">Total Distance:</span> {trip.distance} km
            </div>
            <div>
              <span className="font-medium">Traveled:</span> {distanceTraveled.toFixed(1)} km
            </div>
            <div>
              <span className="font-medium">Status:</span> In Progress
            </div>
            <div>
              <span className="font-medium">Progress:</span> {calculateProgress()}%
            </div>
          </div>
          
          {currentLocation && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <p className="font-medium">Current Location:</p>
              <p>Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}</p>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={updateDistance} 
            disabled={updating}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Updating...' : 'Update Distance'}
          </Button>
          <Button onClick={handleCompleteTrip} className="flex-1 bg-green-600 hover:bg-green-700">
            Complete Trip
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}