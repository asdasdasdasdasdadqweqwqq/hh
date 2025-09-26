import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navbar } from './Navbar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth()

  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-6">
        {children}
      </main>
    </div>
  )
}