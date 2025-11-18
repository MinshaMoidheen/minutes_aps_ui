import { baseApi } from './baseApi'

export interface MeetingType {
  _id: string
  title: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateMeetingTypeRequest {
  title: string
  description?: string
}

export interface UpdateMeetingTypeRequest {
  title?: string
  description?: string
  isActive?: boolean
}

export interface CreateMeetingTypeResponse {
  code?: string
  message?: string
  data: {
    id: string
    title: string
    description?: string
    isActive: boolean
    createdAt: string
  }
}

export interface GetMeetingTypesResponse {
  code?: string
  message?: string
  data: {
    meetingTypes: MeetingType[]
    total: number
    limit: number
    offset: number
  }
}

export interface UpdateMeetingTypeResponse {
  code?: string
  message?: string
  data: {
    id: string
    title: string
    description?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
}

export const meetingTypeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createMeetingType: builder.mutation<CreateMeetingTypeResponse, CreateMeetingTypeRequest>({
      query: (data) => ({
        url: '/meeting-types',
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: ['MeetingType'],
    }),

    getMeetingTypes: builder.query<GetMeetingTypesResponse, { limit?: number; offset?: number; search?: string; isActive?: boolean }>({
      query: ({ limit = 20, offset = 0, search, isActive } = {}) => {
        const params = new URLSearchParams()
        if (limit) params.append('limit', limit.toString())
        if (offset) params.append('offset', offset.toString())
        if (search) params.append('search', search)
        if (isActive !== undefined) params.append('isActive', isActive.toString())
        return {
          url: `/meeting-types?${params.toString()}`,
          method: 'GET',
          credentials: 'include',
        }
      },
      providesTags: ['MeetingType'],
    }),

    updateMeetingType: builder.mutation<UpdateMeetingTypeResponse, { meetingTypeId: string; data: UpdateMeetingTypeRequest }>({
      query: ({ meetingTypeId, data }) => ({
        url: `/meeting-types/${meetingTypeId}`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { meetingTypeId }) => [
        'MeetingType',
        { type: 'MeetingType', id: meetingTypeId },
      ],
    }),

    deleteMeetingType: builder.mutation<{ code?: string; message?: string }, string>({
      query: (meetingTypeId) => ({
        url: `/meeting-types/${meetingTypeId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['MeetingType'],
    }),
  }),
})

export const {
  useCreateMeetingTypeMutation,
  useGetMeetingTypesQuery,
  useUpdateMeetingTypeMutation,
  useDeleteMeetingTypeMutation,
} = meetingTypeApi


