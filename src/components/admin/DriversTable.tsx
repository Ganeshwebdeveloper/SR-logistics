'use client'

import React, { useState } from 'react'
import { MoreHorizontal, Car, User, Phone, Mail, Shield } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User as UserType } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DriversTableProps {
  drivers: UserType[]
  onRefresh: () => void
}

export function DriversTable({ drivers, onRefresh }: DriversTableProps) {
  const [updatingDriver, setUpdatingDriver] = useState<string | null>(null)

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    setUpdatingDriver(driverId)
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', driverId)

      if (error) throw error

      toast.success('Driver status updated successfully')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error updating driver status')
    } finally {
      setUpdatingDriver(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>
      case 'on_trip':
        return <Badge variant="warning">On Trip</Badge>
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>
      case 'busy':
        return <Badge variant="destructive">Busy</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-purple-600">Admin</Badge>
      case 'driver':
        return <Badge variant="default" className="bg-blue-600">Driver</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="text-lg font-semibold">Drivers</h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">{driver.name}</div>
                    <div className="text-sm text-gray-500">{driver.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    {driver.email}
                  </div>
                  {driver.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      {driver.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getRoleBadge(driver.role)}
              </TableCell>
              <TableCell>
                {getStatusBadge(driver.status || 'offline')}
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">
                  {driver.created_at ? new Date(driver.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(driver.id, 'available')}
                      disabled={updatingDriver === driver.id}
                    >
                      Set Available
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(driver.id, 'on_trip')}
                      disabled={updatingDriver === driver.id}
                    >
                      Set On Trip
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(driver.id, 'offline')}
                      disabled={updatingDriver === driver.id}
                    >
                      Set Offline
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(driver.id, 'busy')}
                      disabled={updatingDriver === driver.id}
                    >
                      Set Busy
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {drivers.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No drivers found</p>
        </div>
      )}
    </div>
  )
}