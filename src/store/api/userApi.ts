import { USER_URL } from '@/constants'
import { baseApi } from './baseApi'

export interface CreateUserRequest {
  email: string
  password: string
  username?: string
  company?: string
  role?: 'admin' | 'user' | 'superadmin'
  refAdmin?: string
  designation?: string
  workingHours?: {
    punchin: {
      from: string
      to: string
    }
    punchout: {
      from: string
      to: string
    }
  }
  attendanceCoordinateId?: string
  faceImages?: string[]
}

export interface User {
  _id: string
  username?: string
  email: string
  role?: string
  company?: string
  refAdmin?: {
    _id: string
    name: string
    email: string
    company: string
  } | string
  designation?: string
  workingHours?: {
    punchin: {
      from: string
      to: string
    }
    punchout: {
      from: string
      to: string
    }
  }
  attendanceCoordinateId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserResponse {
  user: User
  accessToken: string
}

export interface GetUsersResponse {
  message: string
  users: User[]
  total: number
  limit: number
  offset: number
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation<CreateUserResponse, CreateUserRequest>({
      query: (userData) => ({
        url: USER_URL,
        method: 'POST',
        body: userData,
        credentials: 'include',
      }),
    }),
    getUsers: builder.query<GetUsersResponse, { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 } = {}) => ({
        url: `${USER_URL}?limit=${limit}&offset=${offset}`,
        method: 'GET',
        credentials: 'include',
      }),
    }),
    getAdmins: builder.query<GetUsersResponse, { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 } = {}) => {
        console.log('getAdmins - Calling URL:', `${USER_URL}/admins?limit=${limit}&offset=${offset}`)
        return {
          url: `${USER_URL}/admins?limit=${limit}&offset=${offset}`,
          method: 'GET',
          credentials: 'include',
        }
      },
    }),
    getUserById: builder.query<{ message: string; user: User }, string>({
      query: (userId) => ({
        url: `${USER_URL}/${userId}`,
        method: 'GET',
        credentials: 'include',
      }),
    }),
    updateUser: builder.mutation<{ message: string; user: User }, { userId: string; data: Partial<CreateUserRequest> }>({
      query: ({ userId, data }) => ({
        url: `${USER_URL}/${userId}`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
    }),
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `${USER_URL}/${userId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
    }),
    testAuth: builder.query<{ message: string }, void>({
      query: () => {
        console.log('UserApi - Testing auth, token available:', !!localStorage.getItem('accessToken'))
        return {
          url: `${USER_URL}/current`,
          method: 'GET',
          credentials: 'include',
        }
      },
    }),
  }),
})

export const {
  useCreateUserMutation,
  useGetUsersQuery,
  useGetAdminsQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useTestAuthQuery,
} = userApi


