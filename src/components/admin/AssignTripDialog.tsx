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
    distance: 0,
    estimated_duration: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('trips')
        .insert([{
          ...formData,
          status: 'pending',
          distance: Number(formData.distance),
          estimated_duration: Number(formData.estimated_duration)
        }])

      if (error) throw error

      toast.success('Trip assigned successfully')
      onOpenChange(false)
      setFormData({
        driver_id: '',
        vehicle_id: '',
        start_location: '',
        end_location: '',
        distance: 0,
        estimated_duration: 0
      })
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Error assigning trip')
    } finally {
      setLoading(false)
    }
  }

  const availableVehicles = vehicles.filter(v => v.status === 'available')
  const availableDrivers = drivers

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                min="0"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Est. Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Trip'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}