'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Navigation, MapPin, Satellite } from 'lucide-react'

interface GPSTrackerProps {
  tripId: string
  autoStart?: boolean
  onLocationUpdate?: (lat: number, lng: number) => void
}

export function GPSTracker({ tripId, autoStart = false, onLocationUpdate }: GPSTrackerProps) {
  const [watchId, setWatchId] = useState<number | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null)
  const [gpsPermission, setGpsPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')

  // Check GPS permissions on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        setGpsPermission(permissionStatus.state)
        
        permissionStatus.onchange = () => {
          setGpsPermission(permissionStatus.state)
        }
      })
    }
  }, [])

  // Auto-start tracking when component mounts if autoStart is true
  useEffect(() => {
    if (autoStart && gpsPermission === 'granted') {
      startTracking()
    }
  }, [autoStart, gpsPermission])

  // Function to update trip location in database
  const updateTripLocation = async (lat: number, lng: number) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          current_lat: lat,
          current_lng: lng,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId)

      if (error) throw error

      // Notify parent component if callback provided
      if (onLocationUpdate) {
        onLocationUpdate(lat, lng)
      }

      toast.success('Location updated', {
        description: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
      })
    } catch (error: any) {
      console.error('Error updating trip location:', error)
      toast.error('Failed to update location')
    }
  }

  // Success callback for geolocation
  const handleLocationSuccess = (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords
    setLastPosition(position)
    updateTripLocation(latitude, longitude)
  }

  // Error callback for geolocation
  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Geolocation error:', error)
    let errorMessage = 'Unable to get your location'
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable GPS.'
        setGpsPermission('denied')
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable.'
        break
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.'
        break
    }
    
    toast.error(errorMessage)
  }

  // Request GPS permissions
  const requestGPSPermission = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsPermission('granted')
        toast.success('GPS permission granted')
        startTracking()
      },
      (error) => {
        setGpsPermission('denied')
        handleLocationError(error)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Start tracking GPS location
  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    if (gpsPermission === 'denied') {
      toast.error('GPS permission denied. Please enable location access in your browser settings.')
      return
    }

    const id = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000, // 5 seconds
        timeout: 10000 // 10 seconds
      }
    )

    setWatchId(id)
    setIsTracking(true)
    toast.success('GPS tracking started')
  }

  // Stop tracking GPS location
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setIsTracking(false)
      toast.success('GPS tracking stopped')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  if (gpsPermission === 'denied') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <Satellite className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="font-medium text-red-800">GPS Permission Denied</h3>
        </div>
        <p className="text-sm text-red-600 mt-1">
          Please enable location access in your browser settings to track your trip.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </div>
    )
  }

  if (gpsPermission === 'prompt' && !autoStart) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-blue-800">Enable GPS Tracking</h3>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          Allow location access to track your trip and share your location with the admin.
        </p>
        <Button 
          size="sm" 
          className="mt-2"
          onClick={requestGPSPermission}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Enable GPS
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-green-800 flex items-center">
            <Navigation className="h-5 w-5 mr-2" />
            GPS Tracking {isTracking ? 'Active' : 'Inactive'}
          </h3>
          <p className="text-sm text-green-600">
            {isTracking ? 'Sharing your location with admin...' : 'Location sharing paused'}
          </p>
        </div>
        {!autoStart && (
          <Button
            onClick={isTracking ? stopTracking : startTracking}
            variant={isTracking ? "destructive" : "default"}
            size="sm"
          >
            {isTracking ? 'Stop' : 'Start'}
          </Button>
        )}
      </div>

      {lastPosition && (
        <div className="mt-3 p-2 bg-white rounded border">
          <h4 className="text-xs font-medium text-gray-700">Last Location</h4>
          <p className="text-xs text-gray-600">
            Lat: {lastPosition.coords.latitude.toFixed(6)}
            <br />
            Lng: {lastPosition.coords.longitude.toFixed(6)}
            <br />
            Updated: {new Date(lastPosition.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  )
}