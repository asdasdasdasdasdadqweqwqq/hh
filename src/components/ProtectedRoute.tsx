import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'
import { LoginForm } from './LoginForm'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'patient' | 'doctor' | 'admin'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user || !profile) {
    return <LoginForm />
  }

  if (requiredRole && profile.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}