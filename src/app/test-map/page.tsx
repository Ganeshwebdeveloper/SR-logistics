'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
})

export default function TestMapPage() {
  const testMarkers = [
    {
      id: '1',
      position: [51.505, -0.09] as [number, number],
      popupContent: (
        <div className="p-2">
          <h3 className="font-bold">Test Marker</h3>
          <p className="text-sm">This is a test marker</p>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Test Map</h1>
      <div className="h-96 w-full border rounded-lg">
        <Map 
          markers={testMarkers}
          center={[51.505, -0.09]}
          zoom={13}
        />
      </div>
    </div>
  )
}