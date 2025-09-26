import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../LoadingSpinner'
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  patient_notes: string | null
  doctor_notes: string | null
  profiles: {
    full_name: string
    phone: string | null
    email: string
  }
}

interface Stats {
  total_appointments: number
  pending_appointments: number
  todays_appointments: number
  this_week_appointments: number
}

export function DoctorDashboard() {
  const { user, profile } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<Stats>({
    total_appointments: 0,
    pending_appointments: 0,
    todays_appointments: 0,
    this_week_appointments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Get doctor record
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (doctorError) throw doctorError

      // Fetch upcoming appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles (
            full_name,
            phone,
            email
          )
        `)
        .eq('doctor_id', doctorData.id)
        .gte('appointment_date', format(new Date(), 'yyyy-MM-dd'))
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(10)

      if (appointmentsError) throw appointmentsError

      // Calculate stats
      const { data: allAppointments, error: statsError } = await supabase
        .from('appointments')
        .select('appointment_date, status')
        .eq('doctor_id', doctorData.id)

      if (statsError) throw statsError

      const today = format(new Date(), 'yyyy-MM-dd')
      const weekFromNow = format(addDays(new Date(), 7), 'yyyy-MM-dd')

      const calculatedStats = {
        total_appointments: allAppointments.length,
        pending_appointments: allAppointments.filter(a => a.status === 'pending').length,
        todays_appointments: allAppointments.filter(a => a.appointment_date === today).length,
        this_week_appointments: allAppointments.filter(a => 
          a.appointment_date >= today && a.appointment_date <= weekFromNow
        ).length
      }

      setAppointments(appointmentsData || [])
      setStats(calculatedStats)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)

      if (error) throw error
      await fetchDashboardData()
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Failed to update appointment')
    }
  }

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d, yyyy')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, Dr. {profile?.full_name}
        </h1>
        <p className="text-lg text-gray-600">Here's your practice overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_appointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending_appointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todays_appointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.this_week_appointments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {appointments.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming appointments</p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {appointment.profiles.full_name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{getDateLabel(appointment.appointment_date)}</span>
                        <span>
                          {format(parseISO(`2000-01-01T${appointment.appointment_time}`), 'h:mm a')}
                        </span>
                        {appointment.profiles.phone && (
                          <span>{appointment.profiles.phone}</span>
                        )}
                      </div>
                      
                      {appointment.patient_notes && (
                        <p className="mt-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                          <strong>Patient Notes:</strong> {appointment.patient_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(appointment.status)}
                      <span className="text-sm font-medium capitalize">{appointment.status}</span>
                    </span>
                    
                    {appointment.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}