import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../LoadingSpinner'
import { Calendar, Clock, User, CreditCard, ArrowLeft } from 'lucide-react'
import { format, addDays, isSameDay, parseISO } from 'date-fns'

interface Doctor {
  id: string
  user_id: string
  specialization: string
  experience_years: number
  bio: string | null
  consultation_fee: number
  profiles: {
    full_name: string
    avatar_url: string | null
  }
}

interface TimeSlot {
  time: string
  available: boolean
}

export function BookAppointment() {
  const { doctorId } = useParams<{ doctorId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (doctorId) {
      fetchDoctor()
    }
  }, [doctorId])

  useEffect(() => {
    if (doctor && selectedDate) {
      generateTimeSlots()
    }
  }, [doctor, selectedDate])

  const fetchDoctor = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('id', doctorId)
        .single()

      if (error) throw error
      setDoctor(data)
    } catch (error) {
      console.error('Error fetching doctor:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = async () => {
    if (!doctor) return

    try {
      const dayOfWeek = selectedDate.getDay()
      const dateStr = format(selectedDate, 'yyyy-MM-dd')

      // Get doctor's schedule for the day
      const { data: schedules, error: scheduleError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctor.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)

      if (scheduleError) throw scheduleError

      // Get existing appointments for the date
      const { data: appointments, error: appointmentError } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('doctor_id', doctor.id)
        .eq('appointment_date', dateStr)
        .in('status', ['pending', 'confirmed'])

      if (appointmentError) throw appointmentError

      const bookedTimes = appointments.map(apt => apt.appointment_time)
      const slots: TimeSlot[] = []

      schedules.forEach(schedule => {
        const startTime = parseISO(`2000-01-01T${schedule.start_time}`)
        const endTime = parseISO(`2000-01-01T${schedule.end_time}`)
        
        let currentTime = startTime
        while (currentTime < endTime) {
          const timeStr = format(currentTime, 'HH:mm')
          const isBooked = bookedTimes.includes(timeStr + ':00')
          const isPast = isSameDay(selectedDate, new Date()) && 
                         new Date() > parseISO(`${dateStr}T${timeStr}`)

          slots.push({
            time: timeStr,
            available: !isBooked && !isPast
          })

          // Add 30 minutes for next slot
          currentTime = new Date(currentTime.getTime() + 30 * 60000)
        }
      })

      setTimeSlots(slots)
    } catch (error) {
      console.error('Error generating time slots:', error)
      setTimeSlots([])
    }
  }

  const handleBookAppointment = async () => {
    if (!doctor || !selectedTime || !user) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: doctor.id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime + ':00',
          patient_notes: notes,
          status: 'pending'
        })

      if (error) throw error

      navigate('/appointments', { 
        state: { message: 'Appointment booked successfully! The doctor will confirm shortly.' }
      })
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Failed to book appointment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!doctor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Doctor not found</h1>
        <button
          onClick={() => navigate('/doctors')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to doctors list
        </button>
      </div>
    )
  }

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/doctors')}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Doctors
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Doctor Info Header */}
        <div className="p-6 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mr-6">
              {doctor.profiles?.avatar_url ? (
                <img
                  src={doctor.profiles.avatar_url}
                  alt={doctor.profiles?.full_name}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-blue-600">
                  {doctor.profiles?.full_name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Dr. {doctor.profiles?.full_name}
              </h1>
              <p className="text-lg text-blue-600 font-medium mb-1">{doctor.specialization}</p>
              <p className="text-gray-600">{doctor.experience_years} years experience</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-2xl font-bold text-gray-900">₹{doctor.consultation_fee}</div>
              <div className="text-sm text-gray-600">consultation fee</div>
            </div>
          </div>
          {doctor.bio && (
            <p className="mt-4 text-gray-700">{doctor.bio}</p>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Date Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Select Date
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dates.map((date) => {
                  const isSelected = isSameDay(date, selectedDate)
                  const isToday = isSameDay(date, new Date())
                  
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 rounded-lg text-center border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                        {isToday ? 'Today' : format(date, 'EEE')}
                      </div>
                      <div className="font-semibold">
                        {format(date, 'MMM d')}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Select Time
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTime === slot.time
                        ? 'bg-blue-600 text-white'
                        : slot.available
                        ? 'bg-white border border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-900'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
              {timeSlots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No available time slots for this date
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe your symptoms or reason for visit..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Book Button */}
          <div className="mt-8 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-600">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment will be collected during consultation
            </div>
            <button
              onClick={handleBookAppointment}
              disabled={!selectedTime || submitting}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}