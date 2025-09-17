'use client'

import React from 'react'
import { Trip } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, MapPin, Clock } from 'lucide-react'

interface TripHistoryProps {
  trips: Trip[]
}

export function TripHistory({ trips }: TripHistoryProps) {
  const tripsByMonth = trips.reduce((acc, trip) => {
    const month = new Date(trip.start_time).toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    })
    if (!acc[month]) {
      acc[month] = []
    }
    acc[month].push(trip)
    return acc
  }, {} as Record<string, Trip[]>)

  return (
    <div className="space-y-6">
      {Object.entries(tripsByMonth).map(([month, monthTrips]) => (
        <Card key={month}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {month}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      {new Date(trip.start_time).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-blue-600" />
                        <span>{trip.start_location}</span>
                        <span>→</span>
                        <MapPin className="h-3 w-3 text-green-600" />
                        <span>{trip.end_location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trip.vehicle?.make} {trip.vehicle?.model}
                    </TableCell>
                    <TableCell>{trip.distance} km</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-600" />
                        <span>{trip.estimated_duration} min</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
      
      {trips.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-600">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No trip history found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}