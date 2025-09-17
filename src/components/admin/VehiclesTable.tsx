import React from 'react'
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

interface VehiclesTableProps {
  vehicles: Vehicle[]
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicleId: string) => void
}

export function VehiclesTable({ vehicles, onEdit, onDelete }: VehiclesTableProps) {
  return (
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
                  onClick={() => onEdit(vehicle)}
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
                  onClick={() => onDelete(vehicle.id)}
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
  )
}