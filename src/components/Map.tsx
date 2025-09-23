'use client'

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapMarker {
  id: string
  position: [number, number]
  popupContent: React.ReactNode
  driverName?: string
  vehicle?: string
  licensePlate?: string
}

interface MapProps {
  markers?: MapMarker[]
  center?: [number, number]
  zoom?: number
  className?: string
  showStats?: boolean
}

// Helper function to calculate distance between two coordinates (in km)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Create custom truck icon
const createTruckIcon = (driverName: string = 'Driver') => {
  return L.divIcon({
    className: 'custom-truck-marker',
    html: `
      <div style="
        background: #2563eb;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
        position: relative;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 17h4V5H9v12h1zm7 0h3v-3.5M14 5h6l3 3v9h-3" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
        ${driverName}
      </div>
    `,
    iconSize: [120, 32],
    iconAnchor: [60, 16],
    popupAnchor: [0, -16]
  })
}

export default function Map(props: MapProps) {
  const { 
    markers = [], 
    center = [0, 0], 
    zoom = 2, 
    className = '', 
    showStats = true 
  } = props || {};

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const [mapStats, setMapStats] = useState<{
    totalDistance: number
    averageSpeed: number
    markersCount: number
  }>({
    totalDistance: 0,
    averageSpeed: 0,
    markersCount: 0
  })
  const [isMapInitialized, setIsMapInitialized] = useState(false)

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || isMapInitialized) return

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove()
      } catch (error) {
        console.warn('Error removing existing map:', error)
      }
      mapInstanceRef.current = null
    }

    try {
      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: true
      })
      
      mapInstanceRef.current = map
      setIsMapInitialized(true)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        detectRetina: true
      }).addTo(map)

      L.control.scale({ imperial: false, metric: true }).addTo(map)

    } catch (error) {
      console.error('Error initializing map:', error)
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          markersRef.current.forEach(marker => {
            try {
              if (mapInstanceRef.current && marker) {
                marker.remove()
              }
            } catch (error) {
              console.warn('Error removing marker during cleanup:', error)
            }
          })
          markersRef.current.clear()
          
          mapInstanceRef.current.remove()
        } catch (error) {
          console.warn('Error cleaning up map:', error)
        }
        mapInstanceRef.current = null
        setIsMapInitialized(false)
      }
    }
  }, [center, zoom, isMapInitialized])

  // Update markers when markers array changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapInitialized) return

    try {
      let totalDistance = 0
      let totalTime = 0
      let previousPosition: [number, number] | null = null
      let previousTime: number | null = null

      markers.forEach((marker, index) => {
        if (index > 0 && previousPosition) {
          const [prevLat, prevLng] = previousPosition
          const [currLat, currLng] = marker.position
          const distance = calculateDistance(prevLat, prevLng, currLat, currLng)
          totalDistance += distance

          if (previousTime) {
            const timeDiff = (Date.now() - previousTime) / 1000 / 3600 // hours
            if (timeDiff > 0) {
              totalTime += timeDiff
            }
          }
        }
        previousPosition = marker.position
        previousTime = Date.now()
      })

      const averageSpeed = totalTime > 0 ? totalDistance / totalTime : 0

      setMapStats({
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        averageSpeed: parseFloat(averageSpeed.toFixed(2)),
        markersCount: markers.length
      })

      const currentMarkerIds = new Set(markers.map(m => m.id))

      markersRef.current.forEach((marker, markerId) => {
        if (!currentMarkerIds.has(markerId)) {
          try {
            if (mapInstanceRef.current && marker) {
              marker.remove()
            }
            markersRef.current.delete(markerId)
          } catch (error) {
            console.warn('Error removing old marker:', error)
            markersRef.current.delete(markerId)
          }
        }
      })

      markers.forEach(markerData => {
        if (!mapInstanceRef.current) return
        
        const existingMarker = markersRef.current.get(markerData.id)
        
        if (existingMarker) {
          try {
            existingMarker.setLatLng(markerData.position)
          } catch (error) {
            console.warn('Error updating marker position:', error)
            try {
              existingMarker.remove()
              markersRef.current.delete(markerData.id)
            } catch (removeError) {
              console.warn('Error removing problematic marker:', removeError)
              markersRef.current.delete(markerData.id)
            }
          }
        } else {
          try {
            const truckIcon = createTruckIcon(markerData.driverName)
            const marker = L.marker(markerData.position, { icon: truckIcon }).addTo(mapInstanceRef.current)
            
            if (markerData.popupContent) {
              marker.bindPopup(() => {
                const div = document.createElement('div')
                div.innerHTML = `
                  <div class="p-3 min-w-[250px]">
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="font-bold text-sm">${markerData.driverName || 'Driver'}</h3>
                      <div class="flex items-center text-xs text-green-600">
                        <div class="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Active
                      </div>
                    </div>
                    
                    <div class="space-y-2 text-xs">
                      <div class="flex items-center">
                        <svg class="h-3 w-3 mr-1 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span class="font-medium">Location:</span>
                        <span class="ml-1">${markerData.position[0].toFixed(6)}, ${markerData.position[1].toFixed(6)}</span>
                      </div>
                      
                      ${markerData.vehicle ? `
                      <div class="flex items-center">
                        <svg class="h-3 w-3 mr-1 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M10 17h4V5H9v12h1zm7 0h3v-3.5M14 5h6l3 3v9h-3" />
                          <circle cx="7" cy="17" r="2" />
                          <circle cx="17" cy="17" r="2" />
                        </svg>
                        <span class="font-medium">Vehicle:</span>
                        <span class="ml-1">${markerData.vehicle}</span>
                        ${markerData.licensePlate ? `<span class="ml-2 text-gray-400">(${markerData.licensePlate})</span>` : ''}
                      </div>
                      ` : ''}
                    </div>
                  </div>
                `
                return div
              })
            }
            
            markersRef.current.set(markerData.id, marker)
          } catch (error) {
            console.warn('Error adding new marker:', error)
          }
        }
      })

      if (markers.length > 0) {
        try {
          const bounds = L.latLngBounds(markers.map(m => m.position))
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
        } catch (error) {
          console.warn('Error fitting bounds:', error)
          try {
            mapInstanceRef.current.setView(center, zoom)
          } catch (viewError) {
            console.warn('Error setting map view:', viewError)
          }
        }
      } else {
        try {
          mapInstanceRef.current.setView(center, zoom)
        } catch (error) {
          console.warn('Error setting default view:', error)
        }
      }
    } catch (error) {
      console.error('Error updating map markers:', error)
    }
  }, [markers, center, zoom, isMapInitialized])

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={mapRef} 
        className={`w-full flex-1 ${className}`}
        style={{ minHeight: '300px' }}
      />
      
      {showStats && markers.length > 0 && (
        <div className="bg-gray-50 p-3 border-t">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-700">Total Distance</div>
              <div className="text-lg font-bold text-blue-600">
                {mapStats.totalDistance} km
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Avg Speed</div>
              <div className="text-lg font-bold text-green-600">
                {mapStats.averageSpeed} km/h
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Active Trucks</div>
              <div className="text-lg font-bold text-purple-600">
                {mapStats.markersCount}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}