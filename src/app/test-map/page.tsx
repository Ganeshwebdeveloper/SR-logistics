'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { 
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
      driverName: 'Test Driver',
      vehicle: 'Test Car',
      licensePlate: 'TEST-123',
      startLocation: 'London',
      endLocation: 'Paris',
      speed: 50,
      distance: 10,
      updatedAt: new Date().toISOString()
    }
  ]

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Test Map</h1>
      <div className="h-96 w-full border rounded-lg">
        <LeafletMap 
          markers={testMarkers}
          center={[51.505, -0.09]}
          zoom={13}
        />
      </div>
    </div>
  )
}