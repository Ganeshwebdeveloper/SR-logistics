'use client'

import React, { useEffect, useRef } from 'react'
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
}

interface MapProps {
  markers?: MapMarker[]
  center?: [number, number]
  zoom?: number
  className?: string
}

export default function Map({ markers = [], center = [0, 0], zoom = 2, className = '' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom)
    mapInstanceRef.current = map

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    return () => {
      map.remove()
    }
  }, [center, zoom])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.remove()
    })
    markersRef.current = []

    // Add new markers
    markers.forEach(markerData => {
      const marker = L.marker(markerData.position).addTo(mapInstanceRef.current!)
      
      if (markerData.popupContent) {
        marker.bindPopup(() => {
          const div = document.createElement('div')
          // This will be handled by React's portal system, but for now we'll use simple content
          return div
        })
      }
      
      markersRef.current.push(marker)
    })

    // Fit map to show all markers if there are any
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.position))
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [markers])

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '300px' }}
    />
  )
}