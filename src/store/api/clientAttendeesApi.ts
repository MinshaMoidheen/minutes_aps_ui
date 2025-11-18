import { baseApi } from './baseApi'

// Client Attendee interfaces (same fields as client)
export interface ClientAttendee {
  _id: string
  username: string
  email: string
  phoneNumber: string
  clientId: string
  client?: {
    _id: string
    username: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateClientAttendeeRequest {
  username: string
  email: string
  phoneNumber: string
  clientId: string
}

export interface UpdateClientAttendeeRequest {
  username?: string
  email?: string
  phoneNumber?: string
  clientId?: string
  designation?: string
  department?: string
  isActive?: boolean
}

export interface CreateClientAttendeeResponse {
  success: boolean
  message: string
  attendee: ClientAttendee
}

export interface GetClientAttendeesResponse {
  code?: string
  message?: string
  data: {
    attendees: ClientAttendee[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export interface GetClientAttendeeResponse {
  success: boolean
  attendee: ClientAttendee
}

export interface DeleteClientAttendeeResponse {
  success: boolean
  message: string
}

// Client Attendees API slice (shares baseApi)
export const clientAttendeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create client attendee
    createClientAttendee: builder.mutation<CreateClientAttendeeResponse, CreateClientAttendeeRequest>({
      query: (data) => ({
        url: '/client-attendees',
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: ['ClientAttendee'],
    }),

    // Get all client attendees
    getClientAttendees: builder.query<GetClientAttendeesResponse, { limit?: number; offset?: number; search?: string; clientId?: string; isActive?: boolean }>({
      query: ({ limit = 10, offset = 0, search = '', clientId, isActive } = {}) => ({
        url: '/client-attendees',
        method: 'GET',
        params: { limit, offset, search, clientId, isActive },
        credentials: 'include',
      }),
      providesTags: ['ClientAttendee'],
    }),

    // Get client attendee by ID
    getClientAttendeeById: builder.query<GetClientAttendeeResponse, string>({
      query: (attendeeId) => ({
        url: `/client-attendees/${attendeeId}`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: (result, error, attendeeId) => [{ type: 'ClientAttendee', id: attendeeId }],
    }),

    // Update client attendee
    updateClientAttendee: builder.mutation<CreateClientAttendeeResponse, { attendeeId: string; data: UpdateClientAttendeeRequest }>({
      query: ({ attendeeId, data }) => ({
        url: `/client-attendees/${attendeeId}`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { attendeeId }) => [
        'ClientAttendee',
        { type: 'ClientAttendee', id: attendeeId },
      ],
    }),

    // Delete client attendee
    deleteClientAttendee: builder.mutation<DeleteClientAttendeeResponse, string>({
      query: (attendeeId) => ({
        url: `/client-attendees/${attendeeId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['ClientAttendee'],
    }),

    // Check-in client attendee
    checkInClientAttendee: builder.mutation<{ success: boolean; message: string }, string>({
      query: (attendeeId) => ({
        url: `/client-attendees/${attendeeId}/check-in`,
        method: 'POST',
        credentials: 'include',
      }),
      invalidatesTags: ['ClientAttendee'],
    }),
  }),
})

// Export hooks for usage in functional components
export const {
  useCreateClientAttendeeMutation,
  useGetClientAttendeesQuery,
  useGetClientAttendeeByIdQuery,
  useUpdateClientAttendeeMutation,
  useDeleteClientAttendeeMutation,
  useCheckInClientAttendeeMutation,
} = clientAttendeesApi




