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

export default function Map({ markers = [], center = [0, 0], zoom = 2, className = '', showStats = true }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [mapStats, setMapStats] = useState<{
    totalDistance: number
    averageSpeed: number
    markersCount: number
  }>({
    totalDistance: 0,
    averageSpeed: 0,
    markersCount: 0
  })

  useEffect(() => {
    if (!mapRef.current) return

    // Clean up any existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    // Initialize map
    const map = L.map(mapRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      attributionControl: true
    })
    
    mapInstanceRef.current = map

    // Add tile layer with proper attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      detectRetina: true
    }).addTo(map)

    // Add scale control
    L.control.scale({ imperial: false, metric: true }).addTo(map)

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          // Remove all markers first
          markersRef.current.forEach(marker => {
            if (mapInstanceRef.current) {
              marker.remove()
            }
          })
          markersRef.current = []
          
          // Then remove the map
          mapInstanceRef.current.remove()
        } catch (error) {
          console.warn('Error cleaning up map:', error)
        }
        mapInstanceRef.current = null
      }
    }
  }, [center, zoom])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    try {
      // Calculate distance and speed statistics
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

      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (mapInstanceRef.current) {
          try {
            marker.remove()
          } catch (error) {
            console.warn('Error removing marker:', error)
          }
        }
      })
      markersRef.current = []

      // Add new markers with custom icons
      markers.forEach(markerData => {
        if (!mapInstanceRef.current) return
        
        const customIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })

        try {
          const marker = L.marker(markerData.position, { icon: customIcon }).addTo(mapInstanceRef.current!)
          
          if (markerData.popupContent) {
            marker.bindPopup(() => {
              const div = document.createElement('div')
              div.innerHTML = `
                <div class="p-2">
                  <h3 class="font-bold">${markerData.driverName || 'Driver'}</h3>
                  <p class="text-sm">Location: ${markerData.position[0].toFixed(6)}, ${markerData.position[1].toFixed(6)}</p>
                </div>
              `
              return div
            })
          }
          
          markersRef.current.push(marker)
        } catch (error) {
          console.warn('Error adding marker:', error)
        }
      })

      // Fit map to show all markers if there are any
      if (markers.length > 0) {
        try {
          const bounds = L.latLngBounds(markers.map(m => m.position))
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
        } catch (error) {
          console.warn('Error fitting bounds:', error)
          // Set default view if bounds fitting fails
          mapInstanceRef.current.setView(center, zoom)
        }
      } else {
        // Set default view if no markers
        mapInstanceRef.current.setView(center, zoom)
      }
    } catch (error) {
      console.error('Error updating map markers:', error)
    }
  }, [markers, center, zoom])

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
              <div className="font-semibold text-gray-700">Distance</div>
              <div className="text-lg font-bold text-blue-600">
                {mapStats.totalDistance} km
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Speed</div>
              <div className="text-lg font-bold text-green-600">
                {mapStats.averageSpeed} km/h
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Markers</div>
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