import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../LoadingSpinner'
import { Star, MapPin, Calendar, Filter, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Doctor {
  id: string
  user_id: string
  specialization: string
  experience_years: number
  bio: string | null
  consultation_fee: number
  is_available: boolean
  profiles: {
    full_name: string
    avatar_url: string | null
  }
}

export function DoctorsList() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [specializations, setSpecializations] = useState<string[]>([])

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
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
        .eq('is_verified', true)
        .eq('is_available', true)

      if (error) throw error

      setDoctors(data || [])
      
      // Extract unique specializations
      const uniqueSpecializations = [...new Set(data?.map(d => d.specialization) || [])]
      setSpecializations(uniqueSpecializations)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecialization = !selectedSpecialization || doctor.specialization === selectedSpecialization
    return matchesSearch && matchesSpecialization
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Find a Doctor</h1>
        <p className="text-lg text-gray-600">Browse our network of verified healthcare professionals</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              Search Doctors
            </label>
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Specialization
            </label>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedSpecialization('')
              }}
              className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  {doctor.profiles?.avatar_url ? (
                    <img
                      src={doctor.profiles.avatar_url}
                      alt={doctor.profiles?.full_name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-blue-600">
                      {doctor.profiles?.full_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dr. {doctor.profiles?.full_name}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium">{doctor.specialization}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="h-4 w-4 mr-2 text-yellow-400 fill-current" />
                  {doctor.experience_years} years experience
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  Available for consultation
                </div>
              </div>

              {doctor.bio && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{doctor.bio}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <span className="text-lg font-semibold text-gray-900">₹{doctor.consultation_fee}</span>
                  <span className="text-sm text-gray-600 ml-1">consultation</span>
                </div>
                <Link
                  to={`/book-appointment/${doctor.id}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or browse all doctors.</p>
        </div>
      )}
    </div>
  )
}