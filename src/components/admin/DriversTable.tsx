'use client'

import React, { useState } from 'react'
import { User } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { EditDriverDialog } from './EditDriverDialog'

interface DriversTableProps {
  drivers: User[]
  onRefresh: () => void
}

export function DriversTable({ drivers, onRefresh }: DriversTableProps) {
  const [loading, setLoading] = useState(false)
  const [editingDriver, setEditingDriver] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

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

  const handleDelete = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', driverId)

      if (error) throw error

      toast.success('Driver deleted successfully')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error deleting driver')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      available: 'bg-green-100 text-green-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      on_trip: 'bg-blue-100 text-blue-800'
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status}
      </Badge>
    )
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
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.id}>
              <TableCell className="font-medium">{driver.name}</TableCell>
              <TableCell>{driver.email}</TableCell>
              <TableCell>{getStatusBadge(driver.status || 'available')}</TableCell>
              <TableCell>
                <Badge className="bg-blue-100 text-blue-800">
                  {driver.role}
                </Badge>
              </TableCell>
              <TableCell>••••••••</TableCell>
              <TableCell>
                {new Date(driver.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setEditingDriver(driver)
                      setShowEditDialog(true)
                    }}
                    aria-label={`Edit ${driver.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(driver.id)}
                    aria-label={`Delete ${driver.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingDriver && (
        <EditDriverDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          driver={editingDriver}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}