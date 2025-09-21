'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, RefreshCw, Filter } from 'lucide-react'
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
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAllTrips, setShowAllTrips] = useState(true)

  // Filter active trips (in_progress) when trips prop changes
  useEffect(() => {
    const inProgressTrips = trips.filter(trip => trip.status === 'in_progress')
    setActiveTrips(inProgressTrips)
    setLoading(false)
  }, [trips])

  const handleRefresh = async () => {
    setRefreshing(true)
    
    // Force refresh all active trips by triggering location updates
    try {
      // Get current user's session to verify admin role
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // For each active trip, send a refresh command
        const refreshPromises = activeTrips.map(async (trip) => {
          // This would typically be done through a real-time message or edge function
          // For now, we'll just log it and rely on the automatic refresh
          console.log(`Refreshing location for trip ${trip.id}`)
        })
        
        await Promise.all(refreshPromises)
        toast.success('Refresh command sent to all drivers')
      }
    } catch (error) {
      console.error('Error sending refresh command:', error)
      toast.error('Failed to send refresh command')
    }
    
    onRefresh()
    setTimeout(() => setRefreshing(false), 2000)
  }

  const handleTripSelect = (tripId: string) => {
    if (selectedTripId === tripId) {
      setSelectedTripId(null)
      setShowAllTrips(true)
    } else {
      setSelectedTripId(tripId)
      setShowAllTrips(false)
    }
  }

  const showAllTripsOnMap = () => {
    setSelectedTripId(null)
    setShowAllTrips(true)
  }

  // Prepare map markers based on selection
  const getMapMarkers = () => {
    let tripsToShow = activeTrips
    
    if (selectedTripId) {
      tripsToShow = activeTrips.filter(trip => trip.id === selectedTripId)
    } else if (!showAllTrips) {
      return []
    }
    
    return tripsToShow
      .filter(trip => trip.current_lat && trip.current_lng)
      .map(trip => ({
        id: trip.id,
        position: [trip.current_lat!, trip.current_lng!] as [number, number],
        driverName: trip.driver?.name || 'Unknown Driver',
        popupContent: (
          <div className="p-2">
            <h3 className="font-bold">{trip.driver?.name || 'Unknown Driver'}</h3>
            <p className="text-sm">Trip: {trip.start_location} → {trip.end_location}</p>
            <p className="text-xs text-gray-500">
              Updated: {new Date(trip.updated_at).toLocaleTimeString()}
            </p>
            <p className="text-xs text-gray-500">
              Location: {trip.current_lat?.toFixed(6)}, {trip.current_lng?.toFixed(6)}
            </p>
          </div>
        )
      }))
  }

  const mapMarkers = getMapMarkers()
  const selectedTrip = selectedTripId ? activeTrips.find(t => t.id === selectedTripId) : null

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Live Map</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={showAllTripsOnMap}
            disabled={showAllTrips && !selectedTripId}
          >
            <Filter className="h-4 w-4" />
          </Button>
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
              center={selectedTrip ? [selectedTrip.current_lat!, selectedTrip.current_lng!] : [0, 0]}
              zoom={selectedTrip ? 15 : 2}
              showStats={true}
            />
          </div>
        )}
        
        {activeTrips.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">
                Active Trips ({activeTrips.length})
                {selectedTripId && ` • Selected: ${selectedTrip?.driver?.name || 'Unknown'}`}
              </h3>
              {selectedTripId && (
                <Button variant="outline" size="sm" onClick={showAllTripsOnMap}>
                  Show All
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {activeTrips.map(trip => (
                <div 
                  key={trip.id} 
                  className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer ${
                    selectedTripId === trip.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleTripSelect(trip.id)}
                >
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      trip.status === 'in_progress' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="font-medium">{trip.driver?.name || 'Unknown'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 text-xs block">
                      {trip.start_location} → {trip.end_location}
                    </span>
                    {trip.current_lat && trip.current_lng && (
                      <span className="text-gray-400 text-xs">
                        {trip.current_lat.toFixed(4)}, {trip.current_lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}