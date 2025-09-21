'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trip } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface LiveMapProps {
  trips: Trip[]
  onRefresh: () => void
}

export function LiveMap({ trips, onRefresh }: LiveMapProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [updatingTrips, setUpdatingTrips] = useState<Set<string>>(new Set())
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [mapImageUrl, setMapImageUrl] = useState<string>('')

  const activeTrips = trips.filter(trip => trip.status === 'in_progress')

  useEffect(() => {
    // Generate map image URL based on selected trip or all active trips
    if (selectedTrip && selectedTrip.current_lat && selectedTrip.current_lng) {
      // Show selected trip location
      const lat = selectedTrip.current_lat
      const lng = selectedTrip.current_lng
      setMapImageUrl(`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=13&size=600x400&markers=color:red%7C${lat},${lng}&key=YOUR_GOOGLE_MAPS_API_KEY`)
    } else if (activeTrips.length > 0) {
      // Show all active trips
      const markers = activeTrips
        .filter(trip => trip.current_lat && trip.current_lng)
        .map((trip, index) => `markers=color:blue%7Clabel:${index + 1}%7C${trip.current_lat},${trip.current_lng}`)
        .join('&')
      
      if (markers) {
        setMapImageUrl(`https://maps.googleapis.com/maps/api/staticmap?size=600x400&${markers}&key=YOUR_GOOGLE_MAPS_API_KEY`)
      } else {
        setMapImageUrl('')
      }
    } else {
      setMapImageUrl('')
    }
  }, [selectedTrip, activeTrips])

  const handleRefreshLocation = async (tripId: string) => {
    setUpdatingTrips(prev => new Set(prev).add(tripId))
    setRefreshing(true)

    try {
      // Simulate location refresh - in a real app, this would trigger
      // a request to the driver's device or update from GPS
      const { error } = await supabase
        .from('trips')
        .update({ 
          updated_at: new Date().toISOString(),
          // Simulate small location change for demo
          current_lat: (Math.random() * 0.02) - 0.01,
          current_lng: (Math.random() * 0.02) - 0.01
        })
        .eq('id', tripId)

      if (error) throw error

      toast.success('Location refreshed successfully')
      onRefresh() // Refresh the parent component data
    } catch (error: any) {
      toast.error(error.message || 'Error refreshing location')
    } finally {
      setUpdatingTrips(prev => {
        const newSet = new Set(prev)
        newSet.delete(tripId)
        return newSet
      })
      setRefreshing(false)
    }
  }

  const refreshAllLocations = async () => {
    setRefreshing(true)
    
    try {
      // Update all active trips with current timestamp and simulate location changes
      const activeTripIds = activeTrips.map(trip => trip.id)

      if (activeTripIds.length === 0) {
        toast.info('No active trips to refresh')
        return
      }

      const updates = activeTripIds.map(id => ({
        id,
        updated_at: new Date().toISOString(),
        current_lat: (Math.random() * 0.02) - 0.01,
        current_lng: (Math.random() * 0.02) - 0.01
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('trips')
          .update({ 
            updated_at: update.updated_at,
            current_lat: update.current_lat,
            current_lng: update.current_lng
          })
          .eq('id', update.id)

        if (error) throw error
      }

      toast.success(`Refreshed ${activeTripIds.length} trip locations`)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error refreshing locations')
    } finally {
      setRefreshing(false)
    }
  }

  const handleTripClick = (trip: Trip) => {
    if (selectedTrip?.id === trip.id) {
      setSelectedTrip(null) // Deselect if clicking the same trip
    } else {
      setSelectedTrip(trip)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Live Map</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllLocations}
            disabled={refreshing}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {mapImageUrl ? (
            <img 
              src={mapImageUrl} 
              alt="Live Map" 
              className="w-full h-full object-cover"
              onError={() => setMapImageUrl('')}
            />
          ) : (
            <div className="text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Map visualization</p>
              <p className="text-xs mt-1">
                {activeTrips.length} active trip{activeTrips.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs mt-2 text-gray-400">
                Click on a trip below to view its location
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <h4 className="font-medium text-sm">Active Trips</h4>
          {activeTrips.map((trip, index) => (
            <div 
              key={trip.id} 
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                selectedTrip?.id === trip.id 
                  ? 'bg-blue-100 border-2 border-blue-300' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => handleTripClick(trip)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">
                    {trip.driver?.name || 'Unknown Driver'}
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    In Progress
                  </span>
                  {selectedTrip?.id === trip.id && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {trip.start_location} → {trip.end_location}
                </p>
                {trip.current_lat && trip.current_lng && (
                  <p className="text-xs text-gray-500 mt-1">
                    Location: {trip.current_lat.toFixed(4)}, {trip.current_lng.toFixed(4)}
                  </p>
                )}
                {trip.updated_at && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                    <span>Updated: {new Date(trip.updated_at).toLocaleTimeString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRefreshLocation(trip.id)
                      }}
                      disabled={refreshing || updatingTrips.has(trip.id)}
                    >
                      <RefreshCw className={`h-3 w-3 ${updatingTrips.has(trip.id) ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium">
                  {trip.distance ? `${trip.distance.toFixed(1)} km` : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  {trip.vehicle?.make} {trip.vehicle?.model}
                </p>
              </div>
            </div>
          ))}
          
          {activeTrips.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No active trips</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}