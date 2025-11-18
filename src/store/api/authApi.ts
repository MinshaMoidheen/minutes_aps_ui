import { baseApi } from './baseApi'

export interface LoginRequest {
  email: string
  password: string
}


export interface LoginResponse {
  message: string
  user: {
    _id: string
    email: string
    name?: string
    username?: string
    role?: string
    [key: string]: any
  }
  userType: 'user' | 'admin' | 'superadmin'
  accessToken: string
}


export interface User {
  _id: string
  email: string
  name?: string
  userType: 'user' | 'admin' | 'superadmin'
  [key: string]: any
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
        credentials: 'include', // Important for cookies
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
        credentials: 'include',
      }),
      // Handle 204 No Content response
      transformResponse: () => undefined,
    }),
    refreshToken: builder.mutation<{ accessToken: string }, void>({
      query: () => ({
        url: '/auth/refresh-token',
        method: 'POST',
        credentials: 'include',
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
} = authApi
