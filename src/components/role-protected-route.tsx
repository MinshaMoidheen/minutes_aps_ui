'use client'

import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: ('user' | 'admin' | 'superadmin')[]
  fallbackUrl?: string
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
//  fallbackUrl = '/unauthorized' 
}: RoleProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // if (!allowedRoles.includes(user.userType as any)) {
      //   router.push(fallbackUrl)
      // }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (user && !allowedRoles.includes(user.userType as any)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}






