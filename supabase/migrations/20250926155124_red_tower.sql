/*
  # Doctor Appointment Booking System Database Schema

  1. New Tables
    - `profiles` - User profiles with role-based access (patient, doctor, admin)
    - `doctors` - Extended doctor information with specialization and availability
    - `doctor_schedules` - Weekly schedule management for doctors
    - `appointments` - Appointment bookings with status tracking
    
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Patients can only access their own data
    - Doctors can manage their profiles and view their appointments
    - Admins have full access
    
  3. Features
    - Comprehensive appointment management
    - Doctor availability scheduling
    - Role-based permissions
    - Data integrity with foreign keys
*/

-- Profiles table for all users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Doctors table for extended doctor information
CREATE TABLE IF NOT EXISTS doctors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  specialization text NOT NULL,
  experience_years integer DEFAULT 0,
  bio text,
  consultation_fee numeric(10,2) DEFAULT 0,
  is_available boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  license_number text,
  education text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Doctor schedules for weekly availability
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  patient_notes text,
  doctor_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can read doctor profiles" ON profiles
  FOR SELECT USING (role = 'doctor');

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Doctors policies
CREATE POLICY "Anyone can read verified doctors" ON doctors
  FOR SELECT USING (is_verified = true);

CREATE POLICY "Doctors can manage own profile" ON doctors
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all doctors" ON doctors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Doctor schedules policies
CREATE POLICY "Anyone can read doctor schedules" ON doctor_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE id = doctor_id AND is_verified = true
    )
  );

CREATE POLICY "Doctors can manage own schedules" ON doctor_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

-- Appointments policies
CREATE POLICY "Patients can read own appointments" ON appointments
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Doctors can read their appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can create appointments" ON appointments
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update own appointments" ON appointments
  FOR UPDATE USING (patient_id = auth.uid());

CREATE POLICY "Doctors can update their appointments" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_availability ON doctors(is_available, is_verified);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON doctor_schedules(day_of_week);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();