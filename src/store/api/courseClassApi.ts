import { baseApi } from './baseApi'

export interface CourseClass {
  _id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateCourseClassRequest {
  name: string
  description?: string
}

export interface UpdateCourseClassRequest {
  name: string
  description?: string
}

export const courseClassApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourseClasses: builder.query<CourseClass[], void>({
      query: () => '/course-classes',
      providesTags: ['CourseClass'],
    }),
    getCourseClassById: builder.query<CourseClass, string>({
      query: (id) => `/course-classes/${id}`,
      providesTags: (result, error, id) => [{ type: 'CourseClass', id }],
    }),
    createCourseClass: builder.mutation<CourseClass, CreateCourseClassRequest>({
      query: (courseClass) => ({
        url: '/course-classes',
        method: 'POST',
        body: courseClass,
      }),
      invalidatesTags: ['CourseClass'],
    }),
    updateCourseClass: builder.mutation<CourseClass, { id: string; data: UpdateCourseClassRequest }>({
      query: ({ id, data }) => ({
        url: `/course-classes/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CourseClass', id },
        'CourseClass',
      ],
    }),
    deleteCourseClass: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/course-classes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CourseClass'],
    }),
  }),
})

export const {
  useGetCourseClassesQuery,
  useGetCourseClassByIdQuery,
  useCreateCourseClassMutation,
  useUpdateCourseClassMutation,
  useDeleteCourseClassMutation,
} = courseClassApi
