'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes?: ('user' | 'admin' | 'superadmin')[]
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Use replace instead of push to prevent back button issues
        router.replace('/auth/sign-in')
        return
      }

      // if (allowedUserTypes && user && !allowedUserTypes.includes(user.userType)) {
      //   router.replace('/unauthorized')
      //   return
      // }
    }
  }, [isAuthenticated, isLoading, user, allowedUserTypes, router])

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

  if (allowedUserTypes && user && !allowedUserTypes.includes(user.userType)) {
    return null
  }

  return <>{children}</>
}
