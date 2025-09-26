import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link, useLocation } from 'react-router-dom'
import { 
  Stethoscope, 
  Calendar, 
  User, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    ...(profile?.role === 'patient' ? [
      { name: 'Find Doctors', href: '/doctors', icon: Users },
      { name: 'My Appointments', href: '/appointments', icon: Calendar },
    ] : []),
    ...(profile?.role === 'doctor' ? [
      { name: 'Dashboard', href: '/doctor/dashboard', icon: Calendar },
      { name: 'Schedule', href: '/doctor/schedule', icon: Settings },
      { name: 'Profile', href: '/doctor/profile', icon: User },
    ] : []),
    ...(profile?.role === 'admin' ? [
      { name: 'Dashboard', href: '/admin/dashboard', icon: Calendar },
      { name: 'Doctors', href: '/admin/doctors', icon: Users },
      { name: 'Users', href: '/admin/users', icon: User },
    ] : []),
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MediBook</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="hidden lg:block">
                  <div className="text-sm font-medium text-gray-900">{profile?.full_name}</div>
                  <div className="text-xs text-gray-500 capitalize">{profile?.role}</div>
                </div>
              </div>
              
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            <div className="pt-4 pb-2 border-t border-gray-200">
              <div className="flex items-center px-3 py-2">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-900">{profile?.full_name}</div>
                  <div className="text-sm text-gray-500 capitalize">{profile?.role}</div>
                </div>
              </div>
              
              <button
                onClick={signOut}
                className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}