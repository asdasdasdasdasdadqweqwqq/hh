import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'patient' | 'doctor' | 'admin'
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'patient' | 'doctor' | 'admin'
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'patient' | 'doctor' | 'admin'
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          user_id: string
          specialization: string
          experience_years: number
          bio: string | null
          consultation_fee: number
          is_available: boolean
          is_verified: boolean
          license_number: string | null
          education: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialization: string
          experience_years?: number
          bio?: string | null
          consultation_fee?: number
          is_available?: boolean
          is_verified?: boolean
          license_number?: string | null
          education?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialization?: string
          experience_years?: number
          bio?: string | null
          consultation_fee?: number
          is_available?: boolean
          is_verified?: boolean
          license_number?: string | null
          education?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      doctor_schedules: {
        Row: {
          id: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          appointment_time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes: string | null
          patient_notes: string | null
          doctor_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          appointment_time: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          patient_notes?: string | null
          doctor_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          appointment_date?: string
          appointment_time?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          patient_notes?: string | null
          doctor_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}