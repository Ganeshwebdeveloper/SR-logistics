'use client'

import React, { useState, useEffect } from 'react'
import { Trip } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Car, Navigation, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CurrentTripProps {
  trip: Trip
  onComplete: () => void
}

export function CurrentTrip({ trip, onComplete }: CurrentTripProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distanceTraveled, setDistanceTraveled] = useState(0)
  const [totalDistance, setTotalDistance] = useState(trip.distance || 0)
  const [updating, setUpdating] = useState(false)
  const [gpsPermission, setGpsPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [gpsError, setGpsError] = useState<string>('')
  const [watchId, setWatchId] = useState<number | null>(null)

  useEffect(() => {
    if (trip.status === 'in_progress') {
      checkGPSPermission()
      updateDriverStatus('on_trip')
      calculateTotalDistance()
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [trip.status])

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  const calculateTotalDistance = async () => {
    // In a real implementation, you would use a geocoding service or routing API
    // For now, we'll use a fixed distance or calculate based on coordinates if available
    if (trip.distance && trip.distance > 0) {
      setTotalDistance(trip.distance)
      return
    }

    // If no distance is provided, estimate based on coordinates (if available)
    // This is a placeholder - in production, use a proper routing API
    const estimatedDistance = Math.random() * 50 + 10 // Random between 10-60 km
    setTotalDistance(estimatedDistance)
    
    // Update the trip with the estimated distance
    try {
      const { error } = await supabase
        .from('trips')
        .update({ distance: estimatedDistance })
        .eq('id', trip.id)
      
      if (error) {
        console.warn('Failed to update trip distance:', error)
      }
    } catch (error) {
      console.warn('Error updating trip distance:', error)
    }
  }

  const checkGPSPermission = async () => {
    try {
      if ('permissions' in navigator) {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' })
        setGpsPermission(permissionStatus.state)
        
        permissionStatus.onchange = () => {
          setGpsPermission(permissionStatus.state)
        }
      } else {
        setGpsPermission('prompt')
      }
    } catch (error) {
      console.log('Permission API not supported, defaulting to prompt')
      setGpsPermission('prompt')
    }
  }

  const requestGPSPermission = async () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser')
      toast.error('GPS not supported on this device')
      return false
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      setGpsPermission('granted')
      setGpsError('')
      startGPSMonitoring()
      return true
    } catch (error: any) {
      setGpsPermission('denied')
      setGpsError(error.message || 'Failed to access GPS location')
      toast.error('GPS access denied. Please enable location services.')
      return false
    }
  }

  const startGPSMonitoring = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser')
      return
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newLocation = { lat: latitude, lng: longitude }
        
        // Calculate distance traveled if we have a previous location
        if (currentLocation) {
          const newDistance = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            latitude,
            longitude
          )
          setDistanceTraveled(prev => prev + newDistance)
        }
        
        setCurrentLocation(newLocation)
        updateTripLocation(latitude, longitude)
        setGpsError('')
      },
      (error) => {
        console.error('GPS error:', error)
        setGpsError(error.message)
        toast.error('GPS error: ' + error.message)
      },
      { 
        enableHighAccuracy: true, 
        timeout: 30000, 
        maximumAge: 60000 
      }
    )

    setWatchId(id)
  }

  const updateDriverStatus = async (status: 'available' | 'assigned' | 'on_trip') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', trip.driver_id)

      if (error) {
        console.error('Error updating driver status:', error)
        throw error
      }
    } catch (error) {
      console.error('Error updating driver status:', error)
      // Don't throw to the user, just log
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

      if (error) {
        console.error('Error updating trip location:', error)
        throw error
      }
    } catch (error: any) {
      console.error('Error updating trip location:', error.message || error)
      // Don't show error to user for background updates
    }
  }

  const updateDistanceInDatabase = async () => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          distance: distanceTraveled,
          updated_at: new Date().toISOString()
        })
        .eq('id', trip.id)

      if (error) throw error
      
      toast.success('Distance updated successfully')
    } catch (error: any) {
      console.error('Error updating distance:', error)
      toast.error('Error updating distance: ' + (error.message || 'Unknown error'))
    } finally {
      setUpdating(false)
    }
  }

  const handleCompleteTrip = async () => {
    try {
      // Update final distance
      await updateDistanceInDatabase()
      
      // Update driver status to available
      await updateDriverStatus('available')
      
      // Update vehicle status to available
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'available' })
        .eq('id', trip.vehicle_id)

      if (vehicleError) throw vehicleError
      
      // Update trip status to completed
      const { error: tripError } = await supabase
        .from('trips')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString(),
          distance: distanceTraveled
        })
        .eq('id', trip.id)

      if (tripError) throw tripError
      
      toast.success('Trip completed successfully')
      onComplete()
    } catch (error: any) {
      console.error('Error completing trip:', error)
      toast.error('Error completing trip: ' + (error.message || 'Unknown error'))
    }
  }

  const calculateProgress = () => {
    if (totalDistance === 0) return 0
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
              <span className="font-medium">Total Distance:</span> {totalDistance.toFixed(1)} km
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
          
          {/* GPS Permission Section */}
          {gpsPermission === 'denied' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">GPS Access Denied</p>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Please enable location services in your browser settings to track your location.
              </p>
            </div>
          )}

          {gpsPermission === 'prompt' && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">GPS Permission Required</p>
              </div>
              <p className="text-sm text-yellow-600 mt-1 mb-2">
                Enable GPS tracking to monitor your location during the trip.
              </p>
              <Button 
                onClick={requestGPSPermission} 
                size="sm" 
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Enable GPS Tracking
              </Button>
            </div>
          )}

          {gpsPermission === 'granted' && currentLocation && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-2 text-green-800">
                <MapPin className="h-4 w-4" />
                <p className="text-sm font-medium">Current Location:</p>
              </div>
              <p className="text-sm mt-1">
                Latitude: {currentLocation.lat.toFixed(6)}, Longitude: {currentLocation.lng.toFixed(6)}
              </p>
            </div>
          )}

          {gpsError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">GPS Error</p>
              </div>
              <p className="text-sm text-red-600 mt-1">{gpsError}</p>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={updateDistanceInDatabase} 
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