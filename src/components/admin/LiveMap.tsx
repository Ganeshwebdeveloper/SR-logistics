'use client'

import React, { useEffect, useState } from 'react'
import { Trip } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation, Clock, Car, User, Map as MapIcon } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
      <div className="text-gray-600">Loading map...</div>
    </div>
  )
})

const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false
})

const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false
})

const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false
})

interface LiveMapProps {
  trips: Trip[]
}

// Custom truck icon component
const TruckIcon = ({ status }: { status: string }) => {
  const [isClient, setIsClient] = useState(false)
  const [IconComponent, setIconComponent] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    if (isClient) {
      import('react-leaflet').then((mod) => {
        const L = mod as any
        const iconColor = status === 'in_progress' ? 'blue' : 'green'
        
        const truckIcon = new L.Icon({
          iconUrl: `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${iconColor}" width="24" height="24">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM17 12h-2V9h2v3z"/>
            </svg>
          `)}`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -15]
        })
        setIconComponent(truckIcon)
      })
    }
  }, [isClient, status])

  if (!isClient || !IconComponent) {
    return null
  }

  return IconComponent
}

export function LiveMap({ trips }: LiveMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  // Get center point for map based on active trips
  const getMapCenter = () => {
    const activeTrips = trips.filter(t => t.status === 'in_progress' && t.current_lat && t.current_lng)
    
    if (activeTrips.length === 0) {
      return [28.6139, 77.2090] // Default to Delhi, India
    }

    // Calculate average center of all active trips
    const avgLat = activeTrips.reduce((sum, trip) => sum + (trip.current_lat || 0), 0) / activeTrips.length
    const avgLng = activeTrips.reduce((sum, trip) => sum + (trip.current_lng || 0), 0) / activeTrips.length
    
    return [avgLat, avgLng]
  }

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapIcon className="h-5 w-5 mr-2" />
            Live Trip Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
            <div className="text-gray-600">Loading map...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapIcon className="h-5 w-5 mr-2" />
          Live Trip Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trips.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No active trips to track</p>
          </div>
        ) : (
          <>
            {/* Map Section */}
            <div className="w-full h-96 rounded-lg overflow-hidden border">
              <Map
                center={getMapCenter()}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {trips.map(trip => {
                  if (trip.current_lat && trip.current_lng) {
                    return (
                      <Marker
                        key={trip.id}
                        position={[trip.current_lat, trip.current_lng]}
                        icon={TruckIcon({ status: trip.status })}
                      >
                        <Popup>
                          <div className="p-2 min-w-[200px]">
                            <div className="font-semibold mb-2 flex items-center">
                              <User className="h-4 w-4 mr-2 text-blue-600" />
                              {trip.driver?.name}
                            </div>
                            <div className="text-sm text-gray-600 mb-2 flex items-center">
                              <Car className="h-4 w-4 mr-2 text-gray-600" />
                              {trip.vehicle?.make} {trip.vehicle?.model}
                            </div>
                            <div className="text-sm mb-2">
                              <span className="font-medium">Route:</span>{' '}
                              {trip.start_location} → {trip.end_location}
                            </div>
                            <div className="text-sm mb-2">
                              <span className="font-medium">Distance:</span>{' '}
                              {trip.distance?.toFixed(1) || '0'} km
                            </div>
                            <div className="text-sm">
                              {getStatusBadge(trip.status)}
                            </div>
                            {trip.updated_at && (
                              <div className="text-xs text-gray-500 mt-2">
                                Last updated: {new Date(trip.updated_at).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    )
                  }
                  return null
                })}
              </Map>
            </div>

            {/* Trip Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.map(trip => (
                <div key={trip.id} className="p-4 border rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg flex items-center">
                        <User className="h-4 w-4 mr-2 text-blue-600" />
                        {trip.driver?.name}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Car className="h-3 w-3 mr-1" />
                        {trip.vehicle?.make} {trip.vehicle?.model}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(trip.status)}
                      <p className="text-sm text-gray-600 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Started: {new Date(trip.start_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="font-medium">From:</span>
                      <span className="ml-2">{trip.start_location}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-medium">To:</span>
                      <span className="ml-2">{trip.end_location}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Navigation className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="font-medium">Distance:</span>
                      <span className="ml-2">{trip.distance?.toFixed(1) || '0'} km</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="font-medium">Duration:</span>
                      <span className="ml-2">{formatDuration(trip.estimated_duration)}</span>
                    </div>
                  </div>

                  {trip.current_lat && trip.current_lng && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-md">
                      <p className="text-xs font-medium text-gray-700 mb-1">Current Location:</p>
                      <p className="text-xs text-gray-600">
                        Lat: {trip.current_lat.toFixed(6)}, Lng: {trip.current_lng.toFixed(6)}
                      </p>
                      {trip.updated_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Updated: {new Date(trip.updated_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}