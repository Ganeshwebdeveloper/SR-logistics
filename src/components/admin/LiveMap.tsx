'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, RefreshCw } from 'lucide-react'
import { Trip } from '@/types'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
})

interface LiveMapProps {
  trips: Trip[]
  onRefresh: () => void
}

export function LiveMap({ trips, onRefresh }: LiveMapProps) {
  const [activeTrips, setActiveTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filter active trips (in_progress) when trips prop changes
  useEffect(() => {
    const inProgressTrips = trips.filter(trip => trip.status === 'in_progress')
    setActiveTrips(inProgressTrips)
    setLoading(false)
  }, [trips])

  const handleRefresh = async () => {
    setRefreshing(true)
    onRefresh()
    // Add a small delay to show the refresh animation
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Prepare map markers for active trips
  const mapMarkers = activeTrips
    .filter(trip => trip.current_lat && trip.current_lng)
    .map(trip => ({
      id: trip.id,
      position: [trip.current_lat!, trip.current_lng!] as [number, number],
      driverName: trip.driver?.name || 'Unknown Driver',
      popupContent: (
        <div className="p-2">
          <h3 className="font-bold">{trip.driver?.name || 'Unknown Driver'}</h3>
          <p className="text-sm">Trip: {trip.start_location} → {trip.end_location}</p>
          <p className="text-xs text-gray-500">Updated: {new Date(trip.updated_at).toLocaleTimeString()}</p>
        </div>
      )
    }))

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Live Map</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <MapPin className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">No Active Trips</h3>
            <p className="text-sm text-gray-500">
              Assign trips to drivers to see them on the map
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-80">
            <Map 
              markers={mapMarkers}
              center={[0, 0]}
              zoom={2}
              showStats={true}
            />
          </div>
        )}
        
        {activeTrips.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Active Trips ({activeTrips.length})</h3>
            </div>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
              {activeTrips.map(trip => (
                <div key={trip.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="font-medium">{trip.driver?.name || 'Unknown'}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {trip.start_location} → {trip.end_location}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}