import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../LoadingSpinner'
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MessageSquare, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react'
import { format, parseISO, isPast } from 'date-fns'
import { useLocation } from 'react-router-dom'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  patient_notes: string | null
  doctor_notes: string | null
  doctors: {
    id: string
    specialization: string
    consultation_fee: number
    profiles: {
      full_name: string
      phone: string | null
    }
  }
}

export function PatientAppointments() {
  const { user } = useAuth()
  const location = useLocation()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      fetchAppointments()
    }
    
    // Show success message if navigated from booking
    if (location.state?.message) {
      setMessage(location.state.message)
      setTimeout(() => setMessage(''), 5000)
    }
  }, [user, location])

  const fetchAppointments = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            id,
            specialization,
            consultation_fee,
            profiles (
              full_name,
              phone
            )
          )
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)

      if (error) throw error
      await fetchAppointments()
      setMessage('Appointment cancelled successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Failed to cancel appointment')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    const appointmentDate = parseISO(`${apt.appointment_date}T${apt.appointment_time}`)
    const isAppointmentPast = isPast(appointmentDate)
    
    switch (filter) {
      case 'upcoming':
        return !isAppointmentPast && apt.status !== 'cancelled' && apt.status !== 'completed'
      case 'past':
        return isAppointmentPast || apt.status === 'completed' || apt.status === 'cancelled'
      default:
        return true
    }
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Appointments</h1>
        <p className="text-lg text-gray-600">Manage your healthcare appointments</p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700">{message}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: 'All' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'upcoming' ? 'No upcoming appointments' : 
             filter === 'past' ? 'No past appointments' : 
             'No appointments yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' && 'Book your first appointment to get started with our healthcare services.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => {
            const appointmentDateTime = parseISO(`${appointment.appointment_date}T${appointment.appointment_time}`)
            const isAppointmentPast = isPast(appointmentDateTime)
            
            return (
              <div
                key={appointment.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Dr. {appointment.doctors.profiles.full_name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1 capitalize">{appointment.status}</span>
                          </span>
                        </div>
                        
                        <p className="text-blue-600 font-medium mb-2">{appointment.doctors.specialization}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(parseISO(appointment.appointment_date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {format(parseISO(`2000-01-01T${appointment.appointment_time}`), 'h:mm a')}
                          </div>
                          {appointment.doctors.profiles.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {appointment.doctors.profiles.phone}
                            </div>
                          )}
                        </div>

                        {(appointment.patient_notes || appointment.doctor_notes) && (
                          <div className="space-y-2">
                            {appointment.patient_notes && (
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center mb-1">
                                  <MessageSquare className="h-4 w-4 text-blue-600 mr-1" />
                                  <span className="text-sm font-medium text-blue-900">Your Notes</span>
                                </div>
                                <p className="text-sm text-blue-800">{appointment.patient_notes}</p>
                              </div>
                            )}
                            
                            {appointment.doctor_notes && (
                              <div className="bg-green-50 p-3 rounded-lg">
                                <div className="flex items-center mb-1">
                                  <MessageSquare className="h-4 w-4 text-green-600 mr-1" />
                                  <span className="text-sm font-medium text-green-900">Doctor's Notes</span>
                                </div>
                                <p className="text-sm text-green-800">{appointment.doctor_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 mb-2">
                        ₹{appointment.doctors.consultation_fee}
                      </div>
                      
                      {appointment.status === 'pending' && !isAppointmentPast && (
                        <button
                          onClick={() => cancelAppointment(appointment.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}