# Fleet Management App - Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Supabase account

## Setup Steps

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Get your project URL and anon key
   - Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials

3. **Database Setup**
   Run these SQL queries in your Supabase SQL editor:

   ```sql
   -- Create users table
   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT NOT NULL,
     name TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create vehicles table
   CREATE TABLE vehicles (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     make TEXT NOT NULL,
     model TEXT NOT NULL,
     year INTEGER NOT NULL,
     license_plate TEXT NOT NULL UNIQUE,
     status TEXT NOT NULL CHECK (status IN ('available', 'in_use', 'maintenance')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create trips table
   CREATE TABLE trips (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     driver_id UUID REFERENCES users(id) NOT NULL,
     vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
     start_location TEXT NOT NULL,
     end_location TEXT NOT NULL,
     status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
     start_time TIMESTAMP WITH TIME ZONE NOT NULL,
     end_time TIMESTAMP WITH TIME ZONE,
     estimated_duration INTEGER NOT NULL,
     distance DECIMAL NOT NULL,
     current_lat DECIMAL,
     current_lng DECIMAL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable RLS
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

   CREATE POLICY "Anyone can read vehicles" ON vehicles FOR SELECT USING (true);
   CREATE POLICY "Admins can manage vehicles" ON vehicles FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

   CREATE POLICY "Users can read own trips" ON trips FOR SELECT USING (auth.uid() = driver_id);
   CREATE POLICY "Admins can manage all trips" ON trips FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
   CREATE POLICY "Drivers can update own trips" ON trips FOR UPDATE USING (auth.uid() = driver_id);
   ```

4. **Set up authentication**
   - In Supabase dashboard, go to Authentication → Settings
   - Add your site URL to "Site URL" and "Redirect URLs"
   - Enable email authentication

5. **Create initial users**
   - Sign up through the app interface
   - Manually update the first user's role to 'admin' in the Supabase dashboard

6. **Run the application**
   ```bash
   npm run dev
   ```

## Features

### Admin Dashboard
- View statistics (vehicles, drivers, trips)
- Add and manage vehicles
- Assign trips to drivers
- View all trips and their status
- Live map for tracking current trips

### Driver Dashboard
- View and start assigned trips
- Complete ongoing trips
- View trip history by month
- See vehicle details for each trip

## Technology Stack
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS with Shadcn/UI components
- Supabase for authentication and database
- Lucide React for icons
- Sonner for toast notifications

## Responsive Design
The app is fully responsive and works on both mobile and desktop devices.