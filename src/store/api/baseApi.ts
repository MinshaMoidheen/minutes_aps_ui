import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BASE_URL } from '@/constants'

// Base fetch with auth header
const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) headers.set('authorization', `Bearer ${token}`)
    return headers
  },
})

// Wrap to handle 401 → redirect to login
const baseQueryWithAuthHandling: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  const status = (result as any)?.error?.status
  if (status === 401) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
      } catch {}
      window.location.href = '/auth/sign-in'
    }
  }
  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuthHandling,
  tagTypes: ['Party', 'CourseClass', 'User', 'Client', 'ClientAttendee', 'Schedule', 'MeetingType'],
  endpoints: () => ({}),
})

export type { BaseQueryFn } from '@reduxjs/toolkit/query'


