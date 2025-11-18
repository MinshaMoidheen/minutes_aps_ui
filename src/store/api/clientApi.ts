import { CLIENT_URL } from '@/constants'
import { baseApi } from './baseApi'

export interface CreateClientRequest {
  username: string
  email: string
  phoneNumber: string
  company?: string
  address?: string
}

export interface Client {
  _id: string
  username: string
  email: string
  phoneNumber: string
  refAdmin: string
  company?: string
  address?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateClientResponse {
  client: Client
}

export interface GetClientsResponse {
  clients: Client[]
  total: number
  limit: number
  offset: number
}

export const clientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createClient: builder.mutation<CreateClientResponse, CreateClientRequest>({
      query: (clientData) => ({
        url: CLIENT_URL,
        method: 'POST',
        body: clientData,
        credentials: 'include',
      }),
      invalidatesTags: ['Client'],
    }),
    getClients: builder.query<GetClientsResponse, { limit?: number; offset?: number; search?: string }>({
      query: ({ limit = 20, offset = 0, search } = {}) => {
        const params = new URLSearchParams()
        if (limit) params.append('limit', limit.toString())
        if (offset) params.append('offset', offset.toString())
        if (search) params.append('search', search)
        return {
          url: `${CLIENT_URL}?${params.toString()}`,
          method: 'GET',
          credentials: 'include',
        }
      },
      providesTags: ['Client'],
    }),
    getClientById: builder.query<{ client: Client }, string>({
      query: (clientId) => ({
        url: `${CLIENT_URL}/${clientId}`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: (result, error, clientId) => [{ type: 'Client', id: clientId }],
    }),
    updateClient: builder.mutation<{ client: Client }, { clientId: string; data: Partial<CreateClientRequest> }>({
      query: ({ clientId, data }) => ({
        url: `${CLIENT_URL}/${clientId}`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { clientId }) => [
        'Client',
        { type: 'Client', id: clientId },
      ],
    }),
    deleteClient: builder.mutation<{ message: string }, string>({
      query: (clientId) => ({
        url: `${CLIENT_URL}/${clientId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: (result, error, clientId) => [
        'Client',
        { type: 'Client', id: clientId },
      ],
    }),
  }),
})

export const {
  useCreateClientMutation,
  useGetClientsQuery,
  useGetClientByIdQuery,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi