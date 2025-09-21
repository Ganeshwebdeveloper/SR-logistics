'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface GPSTrackerProps {
  tripId: string
  onLocationUpdate?: (lat: number, lng: number) => void
}

export function GPSTracker({ tripId, onLocationUpdate }: GPSTrackerProps) {
  const [watchId, setWatchId] = useState<number | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null)

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
    toast.error('Unable to get your location')
  }

  // Start tracking GPS location
  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    const id = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 30000, // 30 seconds
        timeout: 27000 // 27 seconds
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

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">GPS Tracking</h3>
          <p className="text-sm text-gray-500">
            {isTracking ? 'Tracking your location...' : 'Location tracking is off'}
          </p>
        </div>
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isTracking
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
      </div>

      {lastPosition && (
        <div className="mt-3 text-xs text-gray-500">
          <p>Last updated: {new Date(lastPosition.timestamp).toLocaleTimeString()}</p>
          <p>
            Location: {lastPosition.coords.latitude.toFixed(6)},{' '}
            {lastPosition.coords.longitude.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  )
}