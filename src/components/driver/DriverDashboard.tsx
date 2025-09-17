'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Trip } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, MapPin, History, Car } from 'lucide-react'
import { toast } from 'sonner'
import { CurrentTrip } from './CurrentTrip'
import { TripHistory } from './TripHistory'
import { WelcomeBanner } from '../dashboard/WelcomeBanner'

export function DriverDashboard() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrips()
  }, [user])

  const fetchTrips = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('trips')
        .select('*, vehicle:vehicles(*)')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })

      setTrips(data || [])
      setCurrentTrip(data?.find(t => t.status === 'in_progress') || null)
    } catch (error) {
      toast.error('Error fetching trips')
    } finally {
      setLoading(false)
    }
  }

  const startTrip = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'in_progress',
          start_time: new Date().toISOString()
        })
        .eq('id', tripId)

      if (error) throw error
      toast.success('Trip started successfully')
      fetchTrips()
    } catch (error) {
      toast.error('Error starting trip')
    }
  }

  const completeTrip = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', tripId)

      if (error) throw error
      toast.success('Trip completed successfully')
      fetchTrips()
    } catch (error) {
      toast.error('Error completing trip')
    }
  }

  const pendingTrips = trips.filter(t => t.status === 'pending')
  const completedTrips = trips.filter(t => t.status === 'completed')

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      
      {currentTrip ? (
        <CurrentTrip 
          trip={currentTrip} 
          onComplete={() => completeTrip(currentTrip.id)} 
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              No Active Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">You don't have any active trips at the moment.</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Trips</TabsTrigger>
          <TabsTrigger value="history">Trip History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingTrips.map(trip => (
              <Card key={trip.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{trip.start_location} → {trip.end_location}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Vehicle:</span>{' '}
                      {trip.vehicle?.make} {trip.vehicle?.model}
                    </div>
                    <div>
                      <span className="font-medium">Distance:</span>{' '}
                      {trip.distance} km
                    </div>
                    <div>
                      <span className="font-medium">Est. Duration:</span>{' '}
                      {trip.estimated_duration} min
                    </div>
                  </div>
                  <Button onClick={() => startTrip(trip.id)}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Trip
                  </Button>
                </CardContent>
              </Card>
            ))}
            {pendingTrips.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-gray-600">
                  <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No pending trips</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <TripHistory trips={completedTrips} />
        </TabsContent>
      </Tabs>
    </div>
  )
}