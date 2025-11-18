import { baseApi } from './baseApi'

export interface ExportParams {
  startDate?: string
  endDate?: string
  meetingTypeId?: string
  clientId?: string
}

export interface ExportResult {
  blob: Blob
  filename: string
}

export interface ImportParams {
  dataType: 'client-attendees' | 'meets'
  file: File
}

export interface ImportResult {
  importedCount: number
  updatedCount: number
  errorCount: number
  errors?: Array<{ row: number; message: string }>
}

export const importExportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    exportData: builder.query<ExportResult, ExportParams>({
      query: ({ startDate, endDate, meetingTypeId, clientId }) => {
        const params: Record<string, string> = {}
        if (startDate) params.startDate = startDate
        if (endDate) params.endDate = endDate
        if (meetingTypeId) params.meetingTypeId = meetingTypeId
        if (clientId) params.clientId = clientId
        return {
          url: `/data/export/meets`,
          method: 'GET',
          params,
          // We need the raw response to extract headers and blob
          responseHandler: async (response) => {
            const blob = await response.blob()
            const cd = response.headers.get('Content-Disposition') || ''
            const match = /filename="?([^";]+)"?/i.exec(cd)
            const filename = match?.[1] || `meets_export_${new Date().toISOString().slice(0,10)}.xlsx`
            return { blob, filename }
          },
        }
      },
    }),
    importData: builder.mutation<ImportResult, ImportParams>({
      query: ({ dataType, file }) => {
        const formData = new FormData()
        // include filename explicitly
        formData.append('file', file, file.name)
        return {
          url: `/data/import/${dataType}`,
          method: 'POST',
          body: formData,
          credentials: 'include' as const,
          headers: undefined, // let browser set multipart boundary
        }
      },
      transformResponse: (response: any) => {
        // Backend returns { code, message, data: { importedCount, updatedCount, errorCount, errors } }
        return response.data || response
      },
    }),
    downloadTemplate: builder.query<ExportResult, { dataType: 'client-attendees' | 'meets' }>({
      query: ({ dataType }) => ({
        url: `/data/import/template/${dataType}`,
        method: 'GET',
        responseHandler: async (response) => {
          const blob = await response.blob()
          const cd = response.headers.get('Content-Disposition') || ''
          const match = /filename="?([^";]+)"?/i.exec(cd)
          const filename = match?.[1] || `${dataType}_template_${new Date().toISOString().slice(0,10)}.xlsx`
          return { blob, filename }
        },
      }),
    }),
  }),
})

export const { useLazyExportDataQuery, useImportDataMutation, useLazyDownloadTemplateQuery } = importExportApi


