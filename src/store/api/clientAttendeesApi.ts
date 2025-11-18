import { baseApi } from './baseApi'
import employeesJson from '@/data/employees.json'

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
      queryFn: async ({ limit = 100, offset = 0, search = '', clientId, isActive } = {}) => {
        try {
          // Get employees from JSON file
          let employees = (employeesJson as any).employees || []
          
          // Filter by active status
          if (isActive !== undefined) {
            employees = employees.filter((emp: any) => 
              isActive ? emp.activeStatus === true : emp.activeStatus === false
            )
          } else {
            // Default: show only active employees
            employees = employees.filter((emp: any) => emp.activeStatus === true)
          }
          
          // Filter by not deleted
          employees = employees.filter((emp: any) => 
            !emp.isDeleted || emp.isDeleted?.status === false
          )
          
          // Filter by search term if provided
          // Note: Removed clientId filtering to show all attendees regardless of client selection
          if (search) {
            const searchLower = search.toLowerCase()
            employees = employees.filter((emp: any) => 
              emp.empName?.toLowerCase().includes(searchLower) ||
              emp.empCode?.toLowerCase().includes(searchLower) ||
              emp.email?.toLowerCase().includes(searchLower) ||
              emp._id?.toLowerCase().includes(searchLower)
            )
          }
          
          // Map employees to attendee format
          const mappedAttendees = employees.map((emp: any) => ({
            _id: emp._id,
            username: emp.empName || '',
            email: emp.email || `${emp.empCode}@employee.com`,
            phoneNumber: emp.PermanentContactNo || emp.CurrentContactNo || '',
            clientId: emp.companyId || '',
            empCode: emp.empCode,
            designation: emp.designationId?.designationName || '',
            department: emp.departmentId?.departmentName || '',
            source: 'json',
          }))
          
          // Apply pagination
          const total = mappedAttendees.length
          const paginatedAttendees = mappedAttendees.slice(offset, offset + limit)
          
          return {
            data: {
              code: 'Success',
              message: 'Attendees retrieved successfully',
              data: {
                attendees: paginatedAttendees,
                pagination: {
                  currentPage: Math.floor(offset / limit) + 1,
                  totalPages: Math.ceil(total / limit),
                  totalItems: total,
                  itemsPerPage: limit,
                }
              }
            }
          }
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
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




