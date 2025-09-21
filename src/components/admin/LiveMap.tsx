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

  const handleRefreshLocation = async (tripId: string) => {
    setUpdatingTrips(prev => new Set(prev).add(tripId))
    setRefreshing(true)

    try {
      // Simulate location refresh - in a real app, this would trigger
      // a request to the driver's device or update from GPS
      const { error } = await supabase
        .from('trips')
        .update({ 
          updated_at: new Date().toISOString()
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
      // Update all active trips with current timestamp
      const activeTripIds = trips
        .filter(trip => trip.status === 'in_progress')
        .map(trip => trip.id)

      if (activeTripIds.length === 0) {
        toast.info('No active trips to refresh')
        return
      }

      const { error } = await supabase
        .from('trips')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .in('id', activeTripIds)

      if (error) throw error

      toast.success(`Refreshed ${activeTripIds.length} trip locations`)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error refreshing locations')
    } finally {
      setRefreshing(false)
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
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Map visualization will be implemented here</p>
            <p className="text-xs mt-1">
              {trips.filter(trip => trip.status === 'in_progress').length} active trips
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <h4 className="font-medium text-sm">Active Trips</h4>
          {trips
            .filter(trip => trip.status === 'in_progress')
            .map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {trip.driver?.name || 'Unknown Driver'}
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      In Progress
                    </span>
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
                        onClick={() => handleRefreshLocation(trip.id)}
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
          
          {trips.filter(trip => trip.status === 'in_progress').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No active trips</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}