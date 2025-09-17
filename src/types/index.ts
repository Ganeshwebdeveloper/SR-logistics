export interface User {
  id: string
  email: string
  role: 'admin' | 'driver'
  name: string
  created_at: string
}

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  status: 'available' | 'in_use' | 'maintenance'
  created_at: string
}

export interface Trip {
  id: string
  driver_id: string
  vehicle_id: string
  start_location: string
  end_location: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  start_time: string
  end_time: string | null
  estimated_duration: number
  distance: number
  current_lat?: number
  current_lng?: number
  created_at: string
  driver?: User
  vehicle?: Vehicle
}