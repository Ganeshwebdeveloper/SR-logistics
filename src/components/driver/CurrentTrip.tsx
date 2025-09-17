'use client'

import React from 'react'
import { Trip } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Car, Navigation } from 'lucide-react'

interface CurrentTripProps {
  trip: Trip
  onComplete: () => void
}

export function CurrentTrip({ trip, onComplete }: CurrentTripProps) {
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Distance:</span> {trip.distance} km
            </div>
            <div>
              <span className="font-medium">Est. Duration:</span> {trip.estimated_duration} min
            </div>
            <div>
              <span className="font-medium">Status:</span> In Progress
            </div>
            <div>
              <span className="font-medium">Progress:</span> Calculating...
            </div>
          </div>
        </div>

        <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700">
          Complete Trip
        </Button>
      </CardContent>
    </Card>
  )
}