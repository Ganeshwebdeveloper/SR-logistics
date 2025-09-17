'use client'

import React from 'react'
import { Trip } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface TripsTableProps {
  trips: Trip[]
}

export function TripsTable({ trips }: TripsTableProps) {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Distance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-medium">
                {trip.driver?.name}
              </TableCell>
              <TableCell>
                {trip.vehicle?.make} {trip.vehicle?.model}
              </TableCell>
              <TableCell>
                {trip.start_location} → {trip.end_location}
              </TableCell>
              <TableCell>{trip.distance} km</TableCell>
              <TableCell>{getStatusBadge(trip.status)}</TableCell>
              <TableCell>
                {new Date(trip.start_time).toLocaleString()}
              </TableCell>
              <TableCell>
                {trip.end_time ? new Date(trip.end_time).toLocaleString() : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}