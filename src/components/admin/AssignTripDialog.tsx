'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Vehicle } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface AssignTripDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: Vehicle[]
  drivers: User[]
  onSuccess: () => void
}

export function AssignTripDialog({ open, onOpenChange, vehicles, drivers, onSuccess }: AssignTripDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    driver_id: '',
    vehicle_id: '',
    start_location: '',
    end_location: '',
    start_time: new Date().toISOString().slice(0, 16) // Current date/time for start
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update driver status to 'assigned'
      if (formData.driver_id) {
        const { error: driverError } = await supabase
          .from('users')
          .update({ status: 'assigned' })
          .eq('id', formData.driver_id)
        
        if (driverError) throw driverError
      }

      // Update vehicle status to 'in_use'
      if (formData.vehicle_id) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({ status: 'in_use' })
          .eq('id', formData.vehicle_id)
        
        if (vehicleError) throw vehicleError
      }

      const { error } = await supabase
        .from('trips')
        .insert([{
          ...formData,
          status: 'pending',
          distance: 0, // Will be updated by GPS when trip starts
          estimated_duration: 0, // Not required as per request
          start_time: new Date(formData.start_time).toISOString()
        }])

      if (error) throw error

      toast.success('Trip assigned successfully')
      onOpenChange(false)
      setFormData({
        driver_id: '',
        vehicle_id: '',
        start_location: '',
        end_location: '',
        start_time: new Date().toISOString().slice(0, 16)
      })
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Error assigning trip')
    } finally {
      setLoading(false)
    }
  }

  // Add safe access to drivers and vehicles arrays
  const availableVehicles = vehicles?.filter(v => v.status === 'available') || []
  const availableDrivers = drivers?.filter(d => d.status === 'available') || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign New Trip</DialogTitle>
          <DialogDescription>
            Assign a new trip to a driver with an available vehicle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driver">Driver</Label>
            <Select
              value={formData.driver_id}
              onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} ({driver.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableDrivers.length === 0 && (
              <p className="text-sm text-red-500">No available drivers found</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle</Label>
            <Select
              value={formData.vehicle_id}
              onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {availableVehicles.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableVehicles.length === 0 && (
              <p className="text-sm text-red-500">No available vehicles found</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_location">Start Location</Label>
              <Input
                id="start_location"
                value={formData.start_location}
                onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_location">End Location</Label>
              <Input
                id="end_location"
                value={formData.end_location}
                onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_time">Start Date & Time</Label>
            <Input
              id="start_time"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || availableDrivers.length === 0 || availableVehicles.length === 0}>
              {loading ? 'Assigning...' : 'Assign Trip'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}