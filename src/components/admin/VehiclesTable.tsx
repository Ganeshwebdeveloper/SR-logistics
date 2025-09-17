'use client'

import React from 'react'
import { Vehicle } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface VehiclesTableProps {
  vehicles: Vehicle[]
  onRefresh: () => void
}

export function VehiclesTable({ vehicles, onRefresh }: VehiclesTableProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Vehicle deleted successfully')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error deleting vehicle')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-red-100 text-red-800'
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
            <TableHead>Make & Model</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>License Plate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-medium">
                {vehicle.make} {vehicle.model}
              </TableCell>
              <TableCell>{vehicle.year}</TableCell>
              <TableCell>{vehicle.license_plate}</TableCell>
              <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(vehicle.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}