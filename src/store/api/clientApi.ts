import { CLIENT_URL, BASE_URL } from '@/constants'
import { baseApi } from './baseApi'
import clientsJson from '@/data/clients.json'

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
    getCommonClients: builder.query<any, { limit?: number; offset?: number; search?: string }>({
      queryFn: async ({ limit = 100, offset = 0, search } = {}, _queryApi, _extraOptions, fetchWithBQ) => {
        try {
          // Get clients from JSON file
          let jsonClients = (clientsJson as any).clients || []
          
          // Map JSON clients to the expected format
          const mappedJsonClients = jsonClients
            .filter((client: any) => 
              client.isActive === true && 
              (!client.isDeleted || client.isDeleted?.status === false)
            )
            .map((client: any) => ({
              _id: client._id,
              username: client.companyName || '',
              email: client.emailIds 
                ? (Array.isArray(client.emailIds) 
                    ? (client.emailIds.length > 0 ? client.emailIds[0] : `${client.companyCode}@company.com`)
                    : client.emailIds) // If it's a string, use it directly
                : `${client.companyCode}@company.com`,
              companyName: client.companyName,
              companyCode: client.companyCode,
              companyId: client.companyId,
              isActive: client.isActive,
              source: 'json', // Mark as from JSON
            }))
          
          // Fetch clients from API
          let apiClients: any[] = []
          try {
            const params = new URLSearchParams()
            params.append('limit', '1000') // Get all clients from API
            params.append('offset', '0')
            if (search) params.append('search', search)
            
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
            const apiUrl = `${BASE_URL}${CLIENT_URL}?${params.toString()}`
            
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'authorization': `Bearer ${token}` } : {}),
              },
              credentials: 'include',
            })
            
            if (response.ok) {
              const apiData = await response.json()
              // Handle different response structures
              apiClients = (apiData?.data?.clients || apiData?.clients || []).map((client: any) => ({
                ...client,
                source: 'api', // Mark as from API
              }))
            }
          } catch (apiError) {
            // If API fails, continue with JSON clients only
            console.warn('Failed to fetch clients from API:', apiError)
          }
          
          // Merge both lists and remove duplicates based on _id
          const allClients = [...mappedJsonClients, ...apiClients]
          const uniqueClients = allClients.filter((client, index, self) => 
            index === self.findIndex((c) => c._id === client._id)
          )
          
          // Filter by search term if provided
          let filteredClients = uniqueClients
          if (search) {
            const searchLower = search.toLowerCase()
            filteredClients = uniqueClients.filter((client: any) => 
              client.username?.toLowerCase().includes(searchLower) ||
              client.email?.toLowerCase().includes(searchLower) ||
              client.companyName?.toLowerCase().includes(searchLower) ||
              client.companyCode?.toLowerCase().includes(searchLower) ||
              client._id?.toLowerCase().includes(searchLower)
            )
          }
          
          // Apply pagination
          const total = filteredClients.length
          const paginatedClients = filteredClients.slice(offset, offset + limit)
          
          return {
            data: {
              clients: paginatedClients,
              total,
              limit,
              offset,
            }
          }
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
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
  useGetCommonClientsQuery,
  useGetClientByIdQuery,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi