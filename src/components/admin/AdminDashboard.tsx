'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Vehicle, Trip } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Users, Car, MapPin, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { AddVehicleDialog } from './AddVehicleDialog'
import { AssignTripDialog } from './AssignTripDialog'
import { VehiclesTable } from './VehiclesTable'
import { DriversTable } from './DriversTable'
import { TripsTable } from './TripsTable'
import { LiveMap } from './LiveMap'
import { WelcomeBanner } from '../dashboard/WelcomeBanner'

export function AdminDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<User[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [showAssignTrip, setShowAssignTrip] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [
        { data: vehiclesData, error: vehiclesError },
        { data: driversData, error: driversError },
        { data: tripsData, error: tripsError }
      ] = await Promise.all([
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*').eq('role', 'driver').order('created_at', { ascending: false }),
        supabase.from('trips').select('*, driver:users(*), vehicle:vehicles(*)').order('created_at', { ascending: false })
      ])

      if (vehiclesError) throw vehiclesError
      if (driversError) throw driversError
      if (tripsError) throw tripsError

      setVehicles(vehiclesData || [])
      setDrivers(driversData || [])
      setTrips(tripsData || [])
    } catch (error) {
      toast.error('Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  console.log(drivers)

  const refreshDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setDrivers(data || [])
      return true
    } catch (error) {
      toast.error('Error refreshing drivers')
      return false
    }
  }

  const stats = [
    {
      title: 'Total Vehicles',
      value: vehicles.length,
      icon: Car,
      color: 'text-blue-600'
    },
    {
      title: 'Total Drivers',
      value: drivers.length,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Ongoing Trips',
      value: trips.filter(t => t.status === 'in_progress').length,
      icon: MapPin,
      color: 'text-orange-600'
    },
    {
      title: 'Completed Trips',
      value: trips.filter(t => t.status === 'completed').length,
      icon: BarChart3,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex space-x-4">
        <Button onClick={() => setShowAddVehicle(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
        <Button variant="outline" onClick={() => setShowAssignTrip(true)}>
          <MapPin className="h-4 w-4 mr-2" />
          Assign Trip
        </Button>
      </div>

      <Tabs defaultValue="trips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="map">Live Map</TabsTrigger>
        </TabsList>

        <TabsContent value="trips">
          <TripsTable trips={trips} />
        </TabsContent>

        <TabsContent value="vehicles">
          <VehiclesTable vehicles={vehicles} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="drivers">
          <DriversTable drivers={drivers} onRefresh={refreshDrivers} />
        </TabsContent>

        <TabsContent value="map">
          <LiveMap trips={trips.filter(t => t.status === 'in_progress')} />
        </TabsContent>
      </Tabs>

      <AddVehicleDialog
        open={showAddVehicle}
        onOpenChange={setShowAddVehicle}
        onSuccess={fetchData}
      />

      <AssignTripDialog
        open={showAssignTrip}
        onOpenChange={setShowAssignTrip}
        vehicles={vehicles}
        drivers={drivers}
        onSuccess={fetchData}
      />
    </div>
  )
}