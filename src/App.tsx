import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginForm } from './components/LoginForm'
import { LoadingSpinner } from './components/LoadingSpinner'
import { useAuth } from './hooks/useAuth'

// Patient Components
import { DoctorsList } from './components/patient/DoctorsList'
import { BookAppointment } from './components/patient/BookAppointment'
import { PatientAppointments } from './components/patient/PatientAppointments'

// Doctor Components
import { DoctorDashboard } from './components/doctor/DoctorDashboard'

// Home component for routing based on role
function Home() {
  const { profile, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!profile) {
    return <LoginForm />
  }

  // Redirect to appropriate dashboard based on role
  switch (profile.role) {
    case 'patient':
      return <Navigate to="/doctors" replace />
    case 'doctor':
      return <Navigate to="/doctor/dashboard" replace />
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />
    default:
      return <Navigate to="/doctors" replace />
  }
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Patient Routes */}
            <Route path="/doctors" element={
              <ProtectedRoute requiredRole="patient">
                <DoctorsList />
              </ProtectedRoute>
            } />
            <Route path="/book-appointment/:doctorId" element={
              <ProtectedRoute requiredRole="patient">
                <BookAppointment />
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute requiredRole="patient">
                <PatientAppointments />
              </ProtectedRoute>
            } />
            
            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App