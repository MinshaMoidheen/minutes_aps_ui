'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLoginMutation, useLogoutMutation, type User } from '@/store/api/authApi'
import { toast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  const [loginMutation] = useLoginMutation()
  const [logoutMutation] = useLogoutMutation()

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have cookies or localStorage data
        const storedUser = localStorage.getItem('user')
        const storedToken = localStorage.getItem('accessToken')
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser))
        } else if (storedUser && !storedToken) {
          // If we have user but no token, clear user data
          localStorage.removeItem('user')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      console.log('Auth Context - Starting login for:', email) // Debug log
      const result = await loginMutation({ email, password }).unwrap()
      console.log('Auth Context - Login response:', result) // Debug log
      
      const userData: User = {
        _id: result.user._id,
        email: result.user.email,
        name: result.user.name || result.user.username || result.user.email,
        userType: result.userType || result.user.role,
      }
      
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Store the access token for API requests
      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken)
        console.log('Auth Context - Token stored:', result.accessToken.substring(0, 20) + '...') // Debug log
      } else {
        console.log('Auth Context - No accessToken in login response:', result) // Debug log
      }
      
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userData.name || userData.email}!`,
      })
      
      // Redirect based on role
      const role = userData.userType
      if (role === 'admin' || role === 'superadmin') {
        router.push('/')
      } else {
        router.push('/schedule')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: 'Login Failed',
        description: error?.data?.message || 'Invalid email or password',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log('Starting logout process...')
      
      // Try to call logout API, but don't wait for it
      logoutMutation().unwrap().catch((error) => {
        console.error('Logout API error:', error)
        // Don't throw - just log the error
      })
      
      console.log('Logout API call initiated')
    } catch (error) {
      console.error('Logout process error:', error)
      // Continue with logout even if there's an error
    }
    
    try {
      console.log('Clearing user data and redirecting...')
      // Always clear user data and redirect immediately
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      console.log('User data cleared')
      
      // Force redirect using window.location to ensure it works
      console.log('Redirecting to login page...')
      window.location.href = '/auth/sign-in'
      console.log('Redirect command executed')
    } catch (error) {
      console.error('Error during logout cleanup:', error)
      // Force redirect even if there's an error
      window.location.href = '/auth/sign-in'
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
