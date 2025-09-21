'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trip, User, Vehicle } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AssignTripDialog } from './AssignTripDialog'

interface RecentTripsProps {
  trips: Trip[]
  drivers: User[]
  vehicles: Vehicle[]
  onRefresh: () => void
}

export function RecentTrips({ trips, drivers, vehicles, onRefresh }: RecentTripsProps) {
  const [showAssignTripDialog, setShowAssignTripDialog] = useState(false)
  const recentTrips = trips.slice(0, 5) // Get latest 5 trips

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Recent Trips</CardTitle>
          <Button size="sm" onClick={() => setShowAssignTripDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assign Trip
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">
                    {trip.driver?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {trip.start_location} → {trip.end_location}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(trip.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(trip.start_time).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {recentTrips.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No recent trips found
            </div>
          )}
        </CardContent>
      </Card>

      <AssignTripDialog
        open={showAssignTripDialog}
        onOpenChange={setShowAssignTripDialog}
        vehicles={vehicles}
        drivers={drivers}
        onSuccess={onRefresh}
      />
    </>
  )
}