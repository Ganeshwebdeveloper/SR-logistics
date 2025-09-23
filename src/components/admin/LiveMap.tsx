'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, RefreshCw, Filter, Car, Gauge, Map } from 'lucide-react'
import { Trip } from '@/types'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

// Dynamically import the Map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/Map'), { 
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

interface TripDetails {
  id: string
  driverName: string
  position: [number, number]
  startLocation: string
  endLocation: string
  distance: number
  speed: number
  updatedAt: string
  vehicle?: string
  licensePlate?: string
}

export function LiveMap({ trips, onRefresh }: LiveMapProps) {
  const [activeTrips, setActiveTrips] = useState<Trip[]>([])
  const [tripDetails, setTripDetails] = useState<TripDetails[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAllTrips, setShowAllTrips] = useState(true)

  // Filter active trips (in_progress) when trips prop changes
  useEffect(() => {
    const inProgressTrips = trips.filter(trip => trip.status === 'in_progress')
    setActiveTrips(inProgressTrips)
    updateTripDetails(inProgressTrips)
    setLoading(false)
  }, [trips])

  const updateTripDetails = (trips: Trip[]) => {
    const details = trips
      .filter(trip => trip.current_lat && trip.current_lng)
      .map(trip => ({
        id: trip.id,
        driverName: trip.driver?.name || 'Unknown Driver',
        position: [trip.current_lat!, trip.current_lng!] as [number, number],
        startLocation: trip.start_location,
        endLocation: trip.end_location,
        distance: trip.distance || 0,
        speed: calculateSpeedFromTrip(trip),
        updatedAt: trip.updated_at || trip.created_at,
        vehicle: trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : undefined,
        licensePlate: trip.vehicle?.license_plate
      }))
    
    setTripDetails(details)
  }

  const calculateSpeedFromTrip = (trip: Trip): number => {
    // This is a simplified calculation - in a real app you'd use GPS data
    // For now, we'll use a random speed based on trip duration
    if (!trip.start_time) return 0
    
    const startTime = new Date(trip.start_time).getTime()
    const now = Date.now()
    const hoursElapsed = (now - startTime) / 1000 / 3600
    
    if (hoursElapsed <= 0) return 0
    
    // Random speed between 30-80 km/h for demo purposes
    return Math.random() * 50 + 30
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    
    try {
      // Force refresh by fetching latest trip data
      const { data: refreshedTrips, error } = await supabase
        .from('trips')
        .select(`
          *,
          driver:users(*),
          vehicle:vehicles(*)
        `)
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error refreshing trips:', error)
        toast.error('Failed to refresh trips')
        return
      }

      // Update the active trips with fresh data
      setActiveTrips(refreshedTrips || [])
      updateTripDetails(refreshedTrips || [])
      
      toast.success('Trips refreshed successfully')
      onRefresh()
    } catch (error) {
      console.error('Error refreshing trips:', error)
      toast.error('Failed to refresh trips')
    } finally {
      setRefreshing(false)
    }
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
    let detailsToShow = tripDetails
    
    if (selectedTripId) {
      detailsToShow = tripDetails.filter(detail => detail.id === selectedTripId)
    } else if (!showAllTrips) {
      return []
    }
    
    return detailsToShow.map(detail => ({
      id: detail.id,
      position: detail.position,
      driverName: detail.driverName,
      vehicle: detail.vehicle,
      licensePlate: detail.licensePlate,
      popupContent: (
        <div className="p-3 min-w-[250px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">{detail.driverName}</h3>
            <div className="flex items-center text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Active
            </div>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1 text-blue-500" />
              <span className="font-medium">Route:</span>
              <span className="ml-1">{detail.startLocation} → {detail.endLocation}</span>
            </div>
            
            <div className="flex items-center">
              <Gauge className="h-3 w-3 mr-1 text-purple-500" />
              <span className="font-medium">Speed:</span>
              <span className="ml-1">{detail.speed.toFixed(1)} km/h</span>
            </div>
            
            <div className="flex items-center">
              <Navigation className="h-3 w-3 mr-1 text-orange-500" />
              <span className="font-medium">Distance:</span>
              <span className="ml-1">{detail.distance.toFixed(1)} km</span>
            </div>
            
            {detail.vehicle && (
              <div className="flex items-center">
                <Car className="h-3 w-3 mr-1 text-gray-500" />
                <span className="font-medium">Vehicle:</span>
                <span className="ml-1">{detail.vehicle}</span>
                {detail.licensePlate && (
                  <span className="ml-2 text-gray-400">({detail.licensePlate})</span>
                )}
              </div>
            )}
            
            <div className="flex items-center text-gray-400">
              <span className="text-xs">Updated: {new Date(detail.updatedAt).toLocaleTimeString()}</span>
            </div>
            
            <div className="flex items-center text-gray-400">
              <Map className="h-3 w-3 mr-1" />
              <span className="text-xs">
                {detail.position[0].toFixed(6)}, {detail.position[1].toFixed(6)}
              </span>
            </div>
          </div>
        </div>
      )
    }))
  }

  const mapMarkers = getMapMarkers()
  const selectedTrip = selectedTripId ? tripDetails.find(t => t.id === selectedTripId) : null

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
            title="Show all trips"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh trips data"
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
            <MapComponent 
              markers={mapMarkers}
              center={selectedTrip ? selectedTrip.position : [0, 0]}
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
                {selectedTripId && ` • Selected: ${selectedTrip?.driverName || 'Unknown'}`}
              </h3>
              {selectedTripId && (
                <Button variant="outline" size="sm" onClick={showAllTripsOnMap}>
                  Show All
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {tripDetails.map(detail => (
                <div 
                  key={detail.id} 
                  className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer ${
                    selectedTripId === detail.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleTripSelect(detail.id)}
                >
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 bg-green-500`}></div>
                    <div>
                      <span className="font-medium">{detail.driverName}</span>
                      <div className="text-xs text-gray-500">
                        {detail.startLocation} → {detail.endLocation}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-purple-600">
                      {detail.speed.toFixed(0)} km/h
                    </div>
                    <div className="text-xs text-gray-400">
                      {detail.distance.toFixed(1)} km
                    </div>
                    <div className="text-xs text-gray-300">
                      {new Date(detail.updatedAt).toLocaleTimeString()}
                    </div>
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