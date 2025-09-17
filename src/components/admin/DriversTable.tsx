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

  return (
    <div className="rounded-md border">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="text-lg font-semibold">Drivers</h3>
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
          {drivers.map((driver) => (
            <TableRow key={driver.id}>
              <TableCell className="font-medium">{driver.name}</TableCell>
              <TableCell>{driver.email}</TableCell>
              <TableCell>
                <Badge className="bg-blue-100 text-blue-800">
                  {driver.role}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(driver.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}