'use client'

import React from 'react'
import { Trip } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation } from 'lucide-react'

interface LiveMapProps {
  trips: Trip[]
}

export function LiveMap({ trips }: LiveMapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Navigation className="h-5 w-5 mr-2" />
          Live Trip Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trips.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No active trips to track</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map(trip => (
              <div key={trip.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">
                      {trip.driver?.name} - {trip.vehicle?.make} {trip.vehicle?.model}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {trip.start_location} → {trip.end_location}
                    </p>
                    <p className="text-sm">Distance: {trip.distance} km</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <MapPin className="h-3 w-3 mr-1" />
                      Active
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Started: {new Date(trip.start_time).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {trip.current_lat && trip.current_lng && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium mb-2">Current Location:</p>
                    <p className="text-sm">
                      Latitude: {trip.current_lat}, Longitude: {trip.current_lng}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}