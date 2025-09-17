'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Trip, Vehicle } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, Car, Calendar, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/layout/Navbar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function VehiclePage() {
  const params = useParams()
  const vehicleId = params.id as string
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVehicleData()
  }, [vehicleId])

  useEffect(() => {
    filterTripsByMonth()
  }, [trips, selectedMonth])

  const fetchVehicleData = async () => {
    try {
      const [vehicleResponse, tripsResponse] = await Promise.all([
        supabase.from('vehicles').select('*').eq('id', vehicleId).single(),
        supabase
          .from('trips')
          .select('*, driver:users(*)')
          .eq('vehicle_id', vehicleId)
          .order('start_time', { ascending: false })
      ])

      if (vehicleResponse.error) throw vehicleResponse.error
      if (tripsResponse.error) throw tripsResponse.error

      setVehicle(vehicleResponse.data)
      setTrips(tripsResponse.data || [])
    } catch (error) {
      toast.error('Error fetching vehicle data')
    } finally {
      setLoading(false)
    }
  }

  const filterTripsByMonth = () => {
    if (selectedMonth === 'all') {
      setFilteredTrips(trips)
      return
    }

    const [year, month] = selectedMonth.split('-')
    const filtered = trips.filter(trip => {
      const tripDate = new Date(trip.start_time)
      return tripDate.getFullYear() === parseInt(year) && 
             tripDate.getMonth() + 1 === parseInt(month)
    })
    setFilteredTrips(filtered)
  }

  const getAvailableMonths = () => {
    const months = new Set<string>()
    trips.forEach(trip => {
      const date = new Date(trip.start_time)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      months.add(monthKey)
    })
    return Array.from(months).sort().reverse()
  }

  const downloadPDF = () => {
    toast.info('PDF download functionality will be implemented')
    // PDF generation logic would go here
  }

  const downloadExcel = () => {
    toast.info('Excel download functionality will be implemented')
    // Excel generation logic would go here
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p>Vehicle not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Profile</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-gray-600" />
                <span className="text-lg font-medium">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </span>
              </div>
              <Badge className={
                vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                vehicle.status === 'in_use' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }>
                {vehicle.status}
              </Badge>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  Plate: {vehicle.license_plate}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={downloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={downloadExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <MapPin className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trips.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Trips</CardTitle>
              <MapPin className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trips.filter(t => t.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
              <Car className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trips.reduce((sum, trip) => sum + (trip.distance || 0), 0).toFixed(1)} km
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all">All Trips</TabsTrigger>
              <TabsTrigger value="filtered">Filter by Month</TabsTrigger>
            </TabsList>
            
            {selectedMonth !== 'all' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Months</option>
                {getAvailableMonths().map(month => (
                  <option key={month} value={month}>
                    {new Date(`${month}-01`).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </option>
                ))}
              </select>
            )}
          </div>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Trips</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map(trip => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          {new Date(trip.start_time).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {trip.driver?.name}
                        </TableCell>
                        <TableCell>
                          {trip.start_location} → {trip.end_location}
                        </TableCell>
                        <TableCell>{trip.distance} km</TableCell>
                        <TableCell>{getStatusBadge(trip.status)}</TableCell>
                        <TableCell>{trip.estimated_duration} min</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filtered">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedMonth === 'all' ? 'All Trips' : 
                    `Trips for ${new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}`
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTrips.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No trips found for selected month</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrips.map(trip => (
                        <TableRow key={trip.id}>
                          <TableCell>
                            {new Date(trip.start_time).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {trip.driver?.name}
                          </TableCell>
                          <TableCell>
                            {trip.start_location} → {trip.end_location}
                          </TableCell>
                          <TableCell>{trip.distance} km</TableCell>
                          <TableCell>{getStatusBadge(trip.status)}</TableCell>
                          <TableCell>{trip.estimated_duration} min</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}