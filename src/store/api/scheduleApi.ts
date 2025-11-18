import { baseApi } from './baseApi'

// Schedule interfaces
export interface Schedule {
  _id: string
  title: string
  meetingTypeId?: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
  clientId?: string
  client?: {
    _id: string
    username: string
    email: string
  }
  attendeeIds: string[]
  attendees?: Array<{
    _id: string
    username: string
    email: string
  }>
  agents?: string
  meetingPoints?: Array<{ pointsDiscussed?: string; planOfAction?: string; accountability?: string }>
  closureReport?: string
  otherAttendees?: string
  organizer?: string
  status: 'incoming' | 'ongoing' | 'previous'
  createdAt: string
  updatedAt: string
}

export interface CreateScheduleRequest {
  title: string
  meetingTypeId?: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
  clientId?: string
  attendeeIds?: string[]
  agenda?: string
  meetingPoints?: Array<{ pointsDiscussed?: string; planOfAction?: string; accountability?: string }>
  closureReport?: string
  otherAttendees?: string
  organizer: string
}

export interface UpdateScheduleRequest {
  title?: string
  meetingTypeId?: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  location?: string
  clientId?: string
  attendeeIds?: string[]
  agenda?: string
  meetingPoints?: Array<{ pointsDiscussed?: string; planOfAction?: string; accountability?: string }>
  closureReport?: string
  otherAttendees?: string
  organizer?: string
}

export interface CreateScheduleResponse {
  success: boolean
  message: string
  schedule: Schedule
}

export interface GetSchedulesResponse {
  success: boolean
  schedules: Schedule[]
  total: number
  page: number
  limit: number
}

export interface GetScheduleResponse {
  success: boolean
  schedule: Schedule
}

export interface DeleteScheduleResponse {
  success: boolean
  message: string
}

export interface StartScheduleResponse {
  success: boolean
  message: string
  schedule: Schedule
}

// Schedule API slice (shares baseApi)
export const scheduleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create schedule
    createSchedule: builder.mutation<CreateScheduleResponse, CreateScheduleRequest>({
      query: (data) => ({
        url: '/schedules',
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: ['Schedule'],
    }),

    // Get all schedules
    getSchedules: builder.query<GetSchedulesResponse, {
      limit?: number;
      offset?: number;
      search?: string;
      status?: string; // 'incoming' | 'ongoing' | 'previous'
      clientId?: string;
      startDate?: string; // ISO
      endDate?: string;   // ISO
    }>({
      query: ({
        limit = 10,
        offset = 0,
        search,
        status,
        clientId,
        startDate,
        endDate,
      } = {}) => {
        const params: Record<string, any> = { limit, offset }
        if (search) params.search = search
        if (status) params.status = status
        if (clientId) params.clientId = clientId
        if (startDate) params.startDate = startDate
        if (endDate) params.endDate = endDate
        return {
          url: '/schedules',
          method: 'GET',
          params,
          credentials: 'include',
        }
      },
      providesTags: ['Schedule'],
    }),

    // Get schedule by ID
    getScheduleById: builder.query<GetScheduleResponse, string>({
      query: (scheduleId) => ({
        url: `/schedules/${scheduleId}`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: (result, error, scheduleId) => [{ type: 'Schedule', id: scheduleId }],
    }),

    // Get schedule by ID without populate (raw data with original IDs)
    getScheduleByIdRaw: builder.query<GetScheduleResponse, string>({
      queryFn: async (scheduleId, _queryApi, _extraOptions, fetchWithBQ) => {
        try {
          // Try to get raw schedule data by making a direct fetch
          // This is a workaround - ideally the backend would preserve IDs even when populate fails
          const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
          const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
          
          // First, try to get the populated version
          const response = await fetch(`${BASE_URL}/schedules/${scheduleId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'authorization': `Bearer ${token}` } : {}),
            },
            credentials: 'include',
          })

          if (!response.ok) {
            return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch schedule' } }
          }

          const data = await response.json()
          const schedule = data?.schedule

          // If clientId or attendeeIds are null/empty, we need to get the raw IDs from the database
          // Since we can't modify the backend, we'll try to reconstruct from what we have
          // The issue is that Mongoose has already replaced the IDs with null
          
          // For now, return the schedule as-is and let the frontend handle the fallback
          return { data: { success: true, schedule } }
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: (result, error, scheduleId) => [{ type: 'Schedule', id: scheduleId }],
    }),

    // Update schedule
    updateSchedule: builder.mutation<CreateScheduleResponse, { scheduleId: string; data: UpdateScheduleRequest }>({
      query: ({ scheduleId, data }) => ({
        url: `/schedules/${scheduleId}`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { scheduleId }) => [
        'Schedule',
        { type: 'Schedule', id: scheduleId },
      ],
    }),

    // Delete schedule
    deleteSchedule: builder.mutation<DeleteScheduleResponse, string>({
      query: (scheduleId) => ({
        url: `/schedules/${scheduleId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['Schedule'],
    }),

    // Start schedule (change status to in-progress)
    startSchedule: builder.mutation<StartScheduleResponse, string>({
      query: (scheduleId) => ({
        url: `/schedules/${scheduleId}/start`,
        method: 'POST',
        credentials: 'include',
      }),
      invalidatesTags: (result, error, scheduleId) => [
        'Schedule',
        { type: 'Schedule', id: scheduleId },
      ],
    }),

    // Complete schedule (change status to completed)
    completeSchedule: builder.mutation<StartScheduleResponse, string>({
      query: (scheduleId) => ({
        url: `/schedules/${scheduleId}/complete`,
        method: 'POST',
        credentials: 'include',
      }),
      invalidatesTags: (result, error, scheduleId) => [
        'Schedule',
        { type: 'Schedule', id: scheduleId },
      ],
    }),

    // Cancel schedule (change status to cancelled)
    cancelSchedule: builder.mutation<StartScheduleResponse, string>({
      query: (scheduleId) => ({
        url: `/schedules/${scheduleId}/cancel`,
        method: 'POST',
        credentials: 'include',
      }),
      invalidatesTags: (result, error, scheduleId) => [
        'Schedule',
        { type: 'Schedule', id: scheduleId },
      ],
    }),
  }),
})

// Export hooks for usage in functional components
export const {
  useCreateScheduleMutation,
  useGetSchedulesQuery,
  useGetScheduleByIdQuery,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
  useStartScheduleMutation,
  useCompleteScheduleMutation,
  useCancelScheduleMutation,
} = scheduleApi




