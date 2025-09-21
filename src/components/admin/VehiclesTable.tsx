'use client'

import React, { useState } from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Vehicle } from '@/types'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { EditVehicleDialog } from './EditVehicleDialog'

interface VehiclesTableProps {
  vehicles: Vehicle[]
  onRefresh: () => void
}

export function VehiclesTable({ vehicles, onRefresh }: VehiclesTableProps) {
  const [loading, setLoading] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setShowEditDialog(true)
  }

  const handleDelete = async (vehicleId: string) => {
    try {
      // Check if vehicle is currently in use
      const { data: activeTrips } = await supabase
        .from('trips')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .in('status', ['pending', 'in_progress'])

      if (activeTrips && activeTrips.length > 0) {
        toast.error('Cannot delete vehicle with active trips')
        return
      }

      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw error

      toast.success('Vehicle deleted successfully')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error deleting vehicle')
    }
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="text-lg font-semibold">Vehicles</h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Make</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>License Plate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <Link href={`/vehicle/${vehicle.id}`} className="text-blue-600 hover:text-blue-800">
                  {vehicle.make}
                </Link>
              </TableCell>
              <TableCell>{vehicle.model}</TableCell>
              <TableCell>{vehicle.year}</TableCell>
              <TableCell>{vehicle.license_plate}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  vehicle.status === 'available' 
                    ? 'bg-green-100 text-green-800'
                    : vehicle.status === 'in_use'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {vehicle.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(vehicle)}
                    disabled={loading}
                    aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Link href={`/vehicle/${vehicle.id}`}>
                    <Button variant="ghost" size="sm" aria-label={`View ${vehicle.make} ${vehicle.model} details`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(vehicle.id)}
                    disabled={loading}
                    aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingVehicle && (
        <EditVehicleDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          vehicle={editingVehicle}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}