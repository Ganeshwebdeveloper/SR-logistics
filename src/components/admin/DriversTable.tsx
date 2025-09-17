'use client'

import React, { useEffect, useState } from 'react'
import { User } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DriversTableProps {
  drivers: User[]
  onRefresh: () => void
}

export function DriversTable({ drivers, onRefresh }: DriversTableProps) {
  const [loading, setLoading] = useState(false)
  
  // Filter to only show drivers (not admins)
  const driverUsers = drivers.filter(user => user.role === 'driver')

  const refreshDrivers = async () => {
    setLoading(true)
    try {
      await onRefresh()
      toast.success('Drivers list refreshed')
    } catch (error) {
      toast.error('Error refreshing drivers')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return { className: 'bg-red-100 text-red-800 border-red-200' }
      case 'driver':
        return { className: 'bg-blue-100 text-blue-800 border-blue-200' }
      default:
        return { className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="text-lg font-semibold">Drivers ({driverUsers.length})</h3>
        <button
          onClick={refreshDrivers}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {driverUsers.length > 0 ? (
            driverUsers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.name}</TableCell>
                <TableCell>{driver.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getRoleBadgeVariant(driver.role).className}>
                    {driver.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(driver.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No drivers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}