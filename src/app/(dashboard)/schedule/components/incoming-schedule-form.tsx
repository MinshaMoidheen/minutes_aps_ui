'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'
import { Schedule } from '../page'
import { BASE_URL, CLIENT_URL } from '@/constants'
// Removed RTK Query hooks - using external API instead
import { useGetMeetingTypesQuery } from '@/store/api/meetingTypeApi'
import { useCreateScheduleMutation, useUpdateScheduleMutation, useGetScheduleByIdQuery } from '@/store/api/scheduleApi'
import { Eye, EyeOff } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { UserPlus, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useCreateClientMutation } from '@/store/api/clientApi'
import { cn } from '@/lib/utils'

const incomingScheduleFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title must be less than 100 characters'),
  meetingTypeId: z.string().optional(),
  startDate: z
    .string()
    .min(1, 'Start date is required'),
  endDate: z
    .string()
    .min(1, 'End date is required'),
  startTime: z
    .string()
    .min(1, 'Start time is required')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z
    .string()
    .min(1, 'End time is required')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  location: z
    .string()
    .trim()
    .min(1, 'Location is required')
    .min(3, 'Location must be at least 3 characters long')
    .max(100, 'Location must be less than 100 characters'),
  clientId: z
    .string()
    .min(1, 'Client is required'),
  attendeeIds: z
    .array(z.string())
    .optional()
    .default([]),
  agenda: z.string().optional(),
  meetingPoints: z
    .array(z.object({
      pointsDiscussed: z.string().optional(),
      planOfAction: z.string().optional(),
      accountability: z.string().optional(),
      status: z.enum(['pending', 'complete']).optional().default('pending'),
    }))
    .optional()
    .default([]),
  closureReport: z.string().optional(),
  otherAttendees: z.string().optional(),
  organizer: z
    .string()
    .trim()
    .min(1, 'Organizer is required')
    .min(2, 'Organizer name must be at least 2 characters long')
    .max(100, 'Organizer name must be less than 100 characters'),
})

type IncomingScheduleFormData = z.infer<typeof incomingScheduleFormSchema>

interface IncomingScheduleFormProps {
  mode: 'create' | 'edit'
  schedule?: Schedule
  onSuccess: () => void
  onCancel: () => void
  onViewDetails?: (schedule: Schedule) => void
  onToggleDetailPanel?: () => void
  isDetailPanelOpen?: boolean
  readOnly?: boolean
}

export function IncomingScheduleForm({ mode, schedule, onSuccess, onCancel, onViewDetails, onToggleDetailPanel, isDetailPanelOpen, readOnly = false }: IncomingScheduleFormProps) {
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState<number | null>(null)
  const [showAttendeeModal, setShowAttendeeModal] = useState(false)
  const [attendeeSearchValue, setAttendeeSearchValue] = useState('')
  const [accountabilityClientOpen, setAccountabilityClientOpen] = useState<{ [key: number]: boolean }>({})
  const [accountabilityClientSearch, setAccountabilityClientSearch] = useState<{ [key: number]: string }>({})
  const form = useForm<IncomingScheduleFormData>({
    resolver: zodResolver(incomingScheduleFormSchema),
    defaultValues: {
      title: '',
      meetingTypeId: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      clientId: '',
      attendeeIds: [], // Start empty
      agenda: '',
      meetingPoints: [],
      closureReport: '',
      otherAttendees: '',
      organizer: '',
    },
  })

  const [clients, setClients] = useState<any[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [createClient, { isLoading: isCreatingClient }] = useCreateClientMutation()
  const [clientOpen, setClientOpen] = useState(false)
  const [clientSearchValue, setClientSearchValue] = useState('')
  
  const selectedClientId = form.watch('clientId')
  
  // Employees/Attendees state
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)

  // Fetch clients from both external API and internal API
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true)
      try {
        const allClients: any[] = []
        
        // Fetch from external API
        try {
          const externalResponse = await fetch('/api/external/clients?page=1&limit=1000')
          const externalResult = await externalResponse.json()
          
          if (externalResult.success && externalResult.data) {
            const externalClientsList = externalResult.data.clients || externalResult.data.data?.clients || externalResult.data || []
            const mappedExternalClients = externalClientsList.map((client: any) => ({
              _id: client._id || client.id,
              username: client.username || client.name || client.clientName || client.companyName || '',
              email: client.email || '',
              companyName: client.companyName || client.company || '',
              companyCode: client.companyCode || '',
              source: 'external',
              ...client
            }))
            allClients.push(...mappedExternalClients)
          }
        } catch (externalError) {
          console.warn('Failed to fetch clients from external API:', externalError)
        }
        
        // Fetch from internal API
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
          const internalResponse = await fetch(`${BASE_URL}${CLIENT_URL}?limit=1000&offset=0`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'authorization': `Bearer ${token}` } : {}),
            },
            credentials: 'include',
          })
          
          if (internalResponse.ok) {
            const internalData = await internalResponse.json()
            const internalClientsList = internalData?.data?.clients || internalData?.clients || []
            const mappedInternalClients = internalClientsList.map((client: any) => ({
              _id: client._id || client.id,
              username: client.username || client.name || client.clientName,
              email: client.email,
              companyName: client.companyName || client.company,
              companyCode: client.companyCode,
              source: 'internal',
              ...client
            }))
            allClients.push(...mappedInternalClients)
          }
        } catch (internalError) {
          console.warn('Failed to fetch clients from internal API:', internalError)
        }
        
        // Remove duplicates based on _id or email, preferring external source
        const uniqueClients = allClients.filter((client, index, self) => {
          const clientId = client._id || client.id
          const clientEmail = client.email
          
          // Find first occurrence of this client (by _id or email)
          const firstIndex = self.findIndex((c: any) => 
            (c._id || c.id) === clientId || 
            (clientEmail && c.email === clientEmail)
          )
          
          // Keep only the first occurrence (external clients come first)
          return index === firstIndex
        })
        
        setClients(uniqueClients)
        
        if (uniqueClients.length === 0) {
          toast({
            title: 'Warning',
            description: 'No clients found from any source.',
            variant: 'destructive',
          })
        }
      } catch (error: any) {
        console.error('Error fetching clients:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch clients. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingClients(false)
      }
    }
    
    fetchClients()
  }, [])

  // Fetch employees from external API
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoadingEmployees(true)
      try {
        const response = await fetch('/api/external/employees?page=1&limit=1000')
        const result = await response.json()
        
        if (result.success && result.data) {
          // Map external API response to expected format
          const employeesList = result.data.employees || result.data.data?.employees || result.data || []
          setEmployees(employeesList.map((emp: any) => ({
            _id: emp._id || emp.id,
            username: emp.username || emp.empName || emp.name,
            email: emp.email,
            empCode: emp.empCode || emp.employeeCode,
            activeStatus: emp.activeStatus !== false,
            ...emp
          })))
        } else {
          console.error('Failed to fetch employees:', result.message)
          toast({
            title: 'Error',
            description: result.message || 'Failed to fetch employees',
            variant: 'destructive',
          })
        }
      } catch (error: any) {
        console.error('Error fetching employees:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch employees. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingEmployees(false)
      }
    }
    
    fetchEmployees()
  }, [])

  // Fetch schedule by ID if editing and schedule ID is available (to get populated fields)
  const { data: scheduleByIdData } = useGetScheduleByIdQuery(
    schedule?._id || '', 
    { skip: mode !== 'edit' || !schedule?._id }
  )
  
  // NOTE: The backend populate() replaces clientId and attendeeIds with null/[] when referenced documents don't exist.
  // This is a backend issue that needs to be fixed. The backend should preserve original IDs even when populate fails.
  // For now, we'll work with what we have and the form will show empty values if IDs are missing.
  
  // Use fetched schedule if available, but fallback to original schedule's IDs if populated values are null/empty
  // This handles cases where populate fails but the original IDs exist
  const scheduleToUse = useMemo(() => {
    const fetched = scheduleByIdData?.schedule
    if (!fetched) return schedule
    
    // If fetched schedule has null/empty clientId or attendeeIds, try to get from original schedule
    const result = { ...fetched }
    
    // Preserve clientId from original if fetched is null/empty
    // Even though original might also be null, we check both
    if ((!fetched.clientId || fetched.clientId === null)) {
      // Try original schedule first
      if (schedule?.clientId) {
        const originalClientId = typeof schedule.clientId === 'object' && schedule.clientId !== null
          ? (schedule.clientId as any)?._id
          : schedule.clientId
        if (originalClientId) {
          result.clientId = originalClientId
        }
      }
    }
    
    // Preserve attendeeIds from original if fetched is empty
    if (!fetched.attendeeIds || fetched.attendeeIds.length === 0) {
      // Try original schedule first
      if (schedule?.attendeeIds && schedule.attendeeIds.length > 0) {
        const originalAttendeeIds = (schedule.attendeeIds as any[])
          .map((v: any) => {
            if (typeof v === 'string') return v
            if (typeof v === 'object' && v !== null && v._id) return v._id
            return null
          })
          .filter((v: any): v is string => typeof v === 'string' && v.trim() !== '')
        
        if (originalAttendeeIds.length > 0) {
          result.attendeeIds = originalAttendeeIds
        }
      }
    }
    
    return result
  }, [scheduleByIdData?.schedule, schedule])

  // Populate form with schedule data when editing
  useEffect(() => {
    // Wait for data to load before populating form
    // Use scheduleToUse which may be fetched with populated fields
    if (mode === 'edit' && scheduleToUse && clients.length > 0 && employees.length > 0) {
      // Format dates from ISO string to YYYY-MM-DD format for date inputs
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return ''
        try {
          const date = new Date(dateString)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        } catch {
          return ''
        }
      }

      // Extract meetingTypeId - it might be an object if populated or a string
      const meetingTypeId = typeof (scheduleToUse as any).meetingTypeId === 'object' 
        ? (scheduleToUse as any).meetingTypeId?._id 
        : (scheduleToUse as any).meetingTypeId
        
      // Extract clientId - it might be an email (saved), an object if populated, a string _id, or in a client field
      let clientId: string | undefined = undefined
      if ((scheduleToUse as any).clientId) {
        if (typeof (scheduleToUse as any).clientId === 'object' && (scheduleToUse as any).clientId !== null) {
          // If it's a populated object, get the _id
          clientId = (scheduleToUse as any).clientId?._id
        } else if (typeof (scheduleToUse as any).clientId === 'string') {
          // Check if it's an email (saved as email) or an _id
          if ((scheduleToUse as any).clientId.includes('@')) {
            // It's an email, find the client by email to get _id for form
            const clientByEmail = clients.find((c: any) => c.email === (scheduleToUse as any).clientId)
            if (clientByEmail && clientByEmail._id) {
              clientId = clientByEmail._id
              console.log('Found client by email - email:', (scheduleToUse as any).clientId, '_id:', clientId)
            }
          } else {
            // It's an _id, use it directly
            clientId = (scheduleToUse as any).clientId
          }
        }
      }
      // Also check if client is populated separately
      if (!clientId && (scheduleToUse as any).client && typeof (scheduleToUse as any).client === 'object') {
        clientId = (scheduleToUse as any).client?._id
      }

      // Extract attendeeIds - handle emails (saved), populated objects, or _id strings
      let attendeeIdsFromSchedule: string[] = []
      
      // Check attendeeIds field (might be array of emails, strings (_ids), or objects)
      if (Array.isArray((scheduleToUse as any).attendeeIds)) {
        attendeeIdsFromSchedule = (scheduleToUse as any).attendeeIds
          .map((v: any) => {
            if (typeof v === 'string') {
              // Check if it's an email (saved as email) or an _id
              if (v.includes('@')) {
                // It's an email, find the attendee by email to get _id for form
                // First try in filteredAttendees (from external API)
                const attendeeByEmail = filteredAttendees.find((a: any) => a.email === v)
                if (attendeeByEmail && attendeeByEmail._id) {
                  console.log('Found attendee by email - email:', v, '_id:', attendeeByEmail._id)
                  return attendeeByEmail._id
                }
                // Try in employees state (from external API)
                const employeeByEmail = employees.find((emp: any) => emp.email === v)
                if (employeeByEmail && employeeByEmail._id) {
                  console.log('Found employee by email - email:', v, '_id:', employeeByEmail._id)
                  return employeeByEmail._id
                }
                return null
              } else {
                // It's an _id, use it directly
                return v
              }
            }
            if (typeof v === 'object' && v !== null && v._id) {
              return v._id
            }
            return null
          })
          .filter((v: any): v is string => typeof v === 'string' && v.trim() !== '')
      }
      
      // If attendeeIds is empty, check attendees field (populated array)
      if (attendeeIdsFromSchedule.length === 0 && Array.isArray((scheduleToUse as any).attendees)) {
        attendeeIdsFromSchedule = (scheduleToUse as any).attendees
          .map((a: any) => {
            if (typeof a === 'string') {
              // Check if it's an email or _id
              if (a.includes('@')) {
                const attendeeByEmail = filteredAttendees.find((att: any) => att.email === a)
                if (attendeeByEmail && attendeeByEmail._id) {
                  return attendeeByEmail._id
                }
                const employeeByEmail = employees.find((emp: any) => emp.email === a)
                if (employeeByEmail && employeeByEmail._id) {
                  return employeeByEmail._id
                }
                return null
              } else {
                return a
              }
            }
            if (typeof a === 'object' && a !== null && a._id) {
              return a._id
            }
            return null
          })
          .filter((v: any): v is string => typeof v === 'string' && v.trim() !== '')
      }

      const formData = {
        title: scheduleToUse.title || '',
        meetingTypeId: meetingTypeId || '',   
        startDate: formatDateForInput(scheduleToUse.startDate),
        endDate: formatDateForInput(scheduleToUse.endDate),
        startTime: scheduleToUse.startTime || '',
        endTime: scheduleToUse.endTime || '',
        location: scheduleToUse.location || '',
        clientId: clientId || '',
        attendeeIds: attendeeIdsFromSchedule,
        agenda: (scheduleToUse as any).agenda || '',
        meetingPoints: ((scheduleToUse as any).meetingPoints || []).map((mp: any) => ({
          ...mp,
          status: mp.status || 'pending',
          // If accountability is a client ID (not "admin"), add "client:" prefix for display
          accountability: mp.accountability && mp.accountability !== 'admin' && !mp.accountability.startsWith('client:')
            ? `client:${mp.accountability}`
            : mp.accountability
        })),
        closureReport: (scheduleToUse as any).closureReport || '',
        otherAttendees: (scheduleToUse as any).otherAttendees || '',
        organizer: (scheduleToUse as any).organizer || '',
      }
      
      console.log('=== Form Population Debug ===')
      console.log('Original schedule.clientId:', (schedule as any)?.clientId)
      console.log('Original schedule.attendeeIds:', (schedule as any)?.attendeeIds)
      console.log('Fetched schedule.clientId:', (scheduleByIdData?.schedule as any)?.clientId)
      console.log('Fetched schedule.attendeeIds:', (scheduleByIdData?.schedule as any)?.attendeeIds)
      console.log('ScheduleToUse.clientId (after fallback):', (scheduleToUse as any).clientId)
      console.log('ScheduleToUse.attendeeIds (after fallback):', (scheduleToUse as any).attendeeIds)
      console.log('ScheduleToUse.client (populated):', (scheduleToUse as any).client)
      console.log('ScheduleToUse.attendees (populated):', (scheduleToUse as any).attendees)
      console.log('MeetingTypeId extracted:', meetingTypeId)
      console.log('ClientId extracted:', clientId)
      console.log('AttendeeIds extracted:', attendeeIdsFromSchedule)
      console.log('Form reset data:', formData)
      
      form.reset(formData)
    }
  }, [mode, schedule, scheduleByIdData, clients, employees, form])

  const { data: meetingTypesData } = useGetMeetingTypesQuery({ limit: 100, offset: 0 })
  const [createSchedule, { isLoading: isCreating }] = useCreateScheduleMutation()
  const [updateSchedule, { isLoading: isUpdating }] = useUpdateScheduleMutation()

  const onSubmit = async (data: IncomingScheduleFormData) => {
    try {
      // Convert date to ISO datetime format
      const startDateTime = new Date(`${data.startDate}T00:00:00Z`).toISOString()
      const endDateTime = new Date(`${data.endDate}T00:00:00Z`).toISOString()
      
      // Process meetingPoints to strip "client:" prefix from accountability values
      const processedMeetingPoints = (data.meetingPoints || []).map((mp: any) => ({
        ...mp,
        accountability: mp.accountability?.startsWith('client:') 
          ? mp.accountability.replace('client:', '') 
          : mp.accountability
      }))

      // Save _id directly (backend expects ObjectId, not email)
      let clientIdToSend: string | undefined = undefined
      if (data.clientId && typeof data.clientId === 'string') {
        // If it's an email (from old data), try to find the _id
        if (data.clientId.includes('@')) {
          const client = clients.find((c: any) => c.email === data.clientId)
          if (client && client._id) {
            clientIdToSend = client._id
            console.log('Found client _id by email - email:', data.clientId, '_id:', client._id)
          } else {
            // If client not found by email, use email as fallback (shouldn't happen normally)
            clientIdToSend = data.clientId
            console.warn('Client not found by email, using email as fallback:', data.clientId)
          }
        } else {
          // It's already an _id, use it directly
          clientIdToSend = data.clientId
          console.log('Using client _id directly:', data.clientId)
        }
      }

      // Save _id array directly (backend expects ObjectId array, not email array)
      const attendeeIdsToSend: string[] = []
      if (data.attendeeIds && Array.isArray(data.attendeeIds) && data.attendeeIds.length > 0) {
        console.log('Processing attendeeIds:', data.attendeeIds)
        
        data.attendeeIds.forEach((attendeeId: string) => {
          // If it's an email (from old data), try to find the _id
          if (attendeeId.includes('@')) {
            // Try to find attendee by email
            const attendee = filteredAttendees.find((a: any) => a.email === attendeeId)
            if (attendee && attendee._id) {
              if (!attendeeIdsToSend.includes(attendee._id)) {
                attendeeIdsToSend.push(attendee._id)
                console.log('Found attendee _id by email - email:', attendeeId, '_id:', attendee._id)
              }
            } else {
              // Try in employees
              const employee = employees.find((emp: any) => emp.email === attendeeId)
              if (employee && employee._id) {
                if (!attendeeIdsToSend.includes(employee._id)) {
                  attendeeIdsToSend.push(employee._id)
                  console.log('Found employee _id by email - email:', attendeeId, '_id:', employee._id)
                }
              } else {
                console.warn('Could not find attendee/employee by email:', attendeeId)
              }
            }
          } else {
            // It's already an _id, use it directly
            if (!attendeeIdsToSend.includes(attendeeId)) {
              attendeeIdsToSend.push(attendeeId)
              console.log('Using attendee _id directly:', attendeeId)
            }
          }
        })
        
        console.log('Final attendee _ids to send:', attendeeIdsToSend)
      }

      const scheduleData = {
        title: data.title,
        meetingTypeId: data.meetingTypeId || undefined,
        startDate: startDateTime,
        endDate: endDateTime,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        clientId: clientIdToSend || undefined, // Save _id instead of email
        attendeeIds: attendeeIdsToSend, // Save _id array instead of email array
        agenda: data.agenda || '',
        meetingPoints: processedMeetingPoints,
        closureReport: data.closureReport,
        otherAttendees: data.otherAttendees,
        organizer: data.organizer,
      }
      
      console.log('Sending schedule data:', scheduleData)
      console.log('Client _id:', clientIdToSend)
      console.log('Attendee _ids:', attendeeIdsToSend)
      
      if (mode === 'edit' && schedule?._id) {
        await updateSchedule({ scheduleId: schedule._id, data: scheduleData }).unwrap()
        toast({
          title: 'Incoming Meeting Updated',
          description: `${data.title} has been updated successfully.`,
        })
      } else {
        await createSchedule(scheduleData).unwrap()
        toast({
          title: 'Incoming Meeting Created',
          description: `${data.title} has been created successfully.`,
        })
      }
      onSuccess()
    } catch (error: any) {
      toast({
        title: mode === 'edit' ? 'Update Failed' : 'Create Failed',
        description: error?.data?.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} incoming meeting.`,
        variant: 'destructive',
      })
    }
  }

  const isLoading = form.formState.isSubmitting || isCreating || isUpdating

  const selectedAttendees = form.watch('attendeeIds') || []

  // Filter attendees - use employees from external API
  const filteredAttendees = useMemo(() => {
    // Filter active employees only
    return employees.filter((emp: any) => emp.activeStatus !== false)
  }, [employees])
  
  // Filter attendees by search term for modal
  const filteredAttendeesForModal = useMemo(() => {
    if (!attendeeSearchValue) return filteredAttendees
    const searchLower = attendeeSearchValue.toLowerCase()
    return filteredAttendees.filter((attendee: any) =>
      attendee.username?.toLowerCase().includes(searchLower) ||
      attendee.email?.toLowerCase().includes(searchLower) ||
      attendee.empCode?.toLowerCase().includes(searchLower)
    )
  }, [filteredAttendees, attendeeSearchValue])
  
  const filteredAttendeeIds = useMemo(() => {
    return filteredAttendeesForModal.map((attendee: any) => attendee._id)
  }, [filteredAttendeesForModal])
  
  const isAllFilteredSelected = useMemo(() => {
    return filteredAttendeeIds.length > 0 && 
           filteredAttendeeIds.every((id: string) => selectedAttendees.includes(id))
  }, [filteredAttendeeIds, selectedAttendees])
  
  const isSomeFilteredSelected = useMemo(() => {
    return filteredAttendeeIds.some((id: string) => selectedAttendees.includes(id)) &&
           !isAllFilteredSelected
  }, [filteredAttendeeIds, selectedAttendees, isAllFilteredSelected])
  
  const handleSelectAllAttendees = () => {
    const currentValue = form.getValues('attendeeIds') || []
    const newValue = [...new Set([...currentValue, ...filteredAttendeeIds])]
    form.setValue('attendeeIds', newValue)
  }
  
  const handleDeselectAllAttendees = () => {
    const currentValue = form.getValues('attendeeIds') || []
    const newValue = currentValue.filter((id: string) => !filteredAttendeeIds.includes(id))
    form.setValue('attendeeIds', newValue)
  }
  
  const handleToggleAttendee = (attendeeId: string) => {
    const currentValue = form.getValues('attendeeIds') || []
    if (currentValue.includes(attendeeId)) {
      form.setValue('attendeeIds', currentValue.filter((id: string) => id !== attendeeId))
    } else {
      form.setValue('attendeeIds', [...currentValue, attendeeId])
    }
  }
  
  // Get selected attendee names for display
  const selectedAttendeeNames = useMemo(() => {
    return filteredAttendees
      .filter((attendee: any) => selectedAttendees.includes(attendee._id))
      .map((attendee: any) => attendee.username)
      .join(', ')
  }, [filteredAttendees, selectedAttendees])

  // Clients are already loaded in state, no need for useMemo

  // Filter clients by search
  const filteredClients = useMemo(() => {
    if (!clientSearchValue) return clients
    const searchLower = clientSearchValue.toLowerCase()
    return clients.filter((client: any) =>
      client.username?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.companyName?.toLowerCase().includes(searchLower) ||
      client.companyCode?.toLowerCase().includes(searchLower)
    )
  }, [clients, clientSearchValue])

  // Check if search value matches any existing client
  const canCreateClient = useMemo(() => {
    if (!clientSearchValue.trim()) return false
    return !clients.some((client: any) =>
      client.username?.toLowerCase() === clientSearchValue.toLowerCase() ||
      client.email?.toLowerCase() === clientSearchValue.toLowerCase() ||
      client.companyName?.toLowerCase() === clientSearchValue.toLowerCase()
    )
  }, [clients, clientSearchValue])

  // Get selected client display value
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null
    return clients.find((client: any) => client._id === selectedClientId)
  }, [clients, selectedClientId])

  const handleCreateClient = async () => {
    if (!clientSearchValue.trim() || !canCreateClient) return
    
    try {
      // Extract email from search value if it contains email format
      const emailMatch = clientSearchValue.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
      const email = emailMatch ? emailMatch[1] : `${clientSearchValue.toLowerCase().replace(/\s+/g, '')}@company.com`
      const username = clientSearchValue.split('(')[0].trim() || clientSearchValue.trim()
      
      const newClient = await createClient({
        username: username,
        email: email,
        phoneNumber: '',
      }).unwrap()
      
      form.setValue('clientId', newClient.client._id)
      setClientOpen(false)
      setClientSearchValue('')
      toast({
        title: 'Client Created',
        description: `${username} has been created successfully.`,
      })
    } catch (error: any) {
      toast({
        title: 'Create Failed',
        description: error?.data?.message || 'Failed to create client.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={readOnly} className="contents">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Meeting Title" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Meeting Type */}
          <FormField
            control={form.control}
            name="meetingTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Type</FormLabel>
                <Select key={`mt-${field.value || 'none'}`} onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select meeting type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {meetingTypesData?.data?.meetingTypes?.map((mt: any) => (
                      <SelectItem key={mt._id} value={mt._id}>
                        {mt.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date and Time Row */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Time */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="time"
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Time */}
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="time"
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Location and Client - One Row (status removed) */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Conference Room A" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status removed; computed server-side */}

            {/* Client Selection - Creatable Select */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Popover open={clientOpen} onOpenChange={setClientOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading || isLoadingClients || readOnly}
                        >
                          {isLoadingClients 
                            ? "Loading clients..."
                            : selectedClient
                            ? selectedClient.companyName 
                              ? `${selectedClient.companyName}${selectedClient.email ? ` (${selectedClient.email})` : ''}`
                              : `${selectedClient.username || 'Client'}${selectedClient.email ? ` (${selectedClient.email})` : ''}`
                            : "Select a client"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search clients or create new..."
                          value={clientSearchValue}
                          onValueChange={setClientSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {canCreateClient && clientSearchValue.trim() ? (
                              <div className="py-2 px-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCreateClient}
                                  disabled={isCreatingClient}
                                  className="w-full justify-start"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create "{clientSearchValue}"
                                </Button>
                              </div>
                            ) : (
                              "No clients found."
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredClients.map((client: any) => {
                              const clientId = client._id || client.id
                              if (!clientId) {
                                console.warn('Client missing _id:', client)
                                return null
                              }
                              return (
                                <CommandItem
                                  key={clientId}
                                  value={`${client.username} ${client.email} ${client.companyName || ''} ${client.companyCode || ''}`}
                                  onSelect={(selectedValue) => {
                                    // Explicitly use client._id, not the selectedValue parameter
                                    const idToSet = client._id || client.id
                                    if (idToSet) {
                                      field.onChange(idToSet)
                                      setClientOpen(false)
                                      setClientSearchValue('')
                                    } else {
                                      console.error('Cannot set clientId: client._id is missing', client)
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === clientId ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {client.companyName 
                                    ? `${client.companyName}${client.email ? ` (${client.email})` : client.companyCode ? ` (${client.companyCode})` : ''}`
                                    : `${client.username || 'Client'}${client.email ? ` (${client.email})` : ''}`}
                                </CommandItem>
                              )
                            })}
                            {canCreateClient && clientSearchValue.trim() && filteredClients.length > 0 && (
                              <CommandItem
                                onSelect={handleCreateClient}
                                className="text-primary font-medium"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Create "{clientSearchValue}"
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Organizer (moved here after Client) */}
            <FormField
              control={form.control}
              name="organizer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organizer</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Meeting organizer name" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Attendees Selection */}
          <FormField
            control={form.control}
            name="attendeeIds"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Attendees</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAttendeeModal(true)}
                    disabled={isLoading || readOnly}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Attendees
                  </Button>
                </div>
                <FormControl>
                  <div className="min-h-[60px] border rounded-md p-3">
                    {selectedAttendees.length > 0 ? (
                      <div className="text-sm">
                        <span className="font-medium">{selectedAttendees.length} attendee{selectedAttendees.length !== 1 ? 's' : ''} selected:</span>
                        <p className="text-muted-foreground mt-1">{selectedAttendeeNames}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attendees selected. Click "Add Attendees" to select.</p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Attendees Selection Modal */}
          <Dialog open={showAttendeeModal} onOpenChange={setShowAttendeeModal}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Select Attendees</DialogTitle>
                <DialogDescription>
                  Search and select attendees for this meeting
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Search attendees..."
                    value={attendeeSearchValue}
                    onChange={(e) => setAttendeeSearchValue(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={isAllFilteredSelected}
                            ref={(input) => {
                              if (input) (input as any).indeterminate = isSomeFilteredSelected
                            }}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleSelectAllAttendees()
                              } else {
                                handleDeselectAllAttendees()
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Employee Code</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingEmployees ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Loading employees...
                          </TableCell>
                        </TableRow>
                      ) : filteredAttendeesForModal.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No attendees found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAttendeesForModal.map((attendee: any) => (
                          <TableRow key={attendee._id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedAttendees.includes(attendee._id)}
                                onCheckedChange={() => handleToggleAttendee(attendee._id)}
                              />
                            </TableCell>
                            <TableCell className="text-sm">{attendee.username}</TableCell>
                            <TableCell className="text-sm">{attendee.empCode || '—'}</TableCell>
                            <TableCell className="text-sm">{attendee.email}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedAttendees.length} of {filteredAttendees.length} attendees selected
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAttendeeModal(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Agenda */}
          <FormField
            control={form.control}
            name="agenda"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Agenda</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter meeting agenda..."
                    className="min-h-[80px]"
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Meeting Points Table */}
          <FormField
            control={form.control}
            name="meetingPoints"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Meeting Points</FormLabel>
                <div className="space-y-4">
                  <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-muted/50 rounded-lg font-medium text-sm">
                    <div className="col-span-4">Points Discussed</div>
                    <div className="col-span-4">Plan of Action</div>
                    <div className="col-span-3">Accountability</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                  {(field.value || []).map((point, index) => {
                    const pointStatus = point.status || 'pending'
                    const isComplete = pointStatus === 'complete'
                    return (
                      <div key={index} className={`grid grid-cols-12 gap-4 p-4 border rounded-lg ${isComplete ? 'bg-green-50 border-green-300' : ''}`}>
                        <div className="col-span-12 md:col-span-4">
                          <Textarea
                            placeholder="Enter the points discussed in the meeting..."
                            value={point.pointsDiscussed || ''}
                            onChange={(e) => {
                              const arr = [...(field.value || [])]
                              arr[index] = { ...arr[index], pointsDiscussed: e.target.value, status: arr[index].status || 'pending' }
                              field.onChange(arr)
                            }}
                            className="min-h-[80px]"
                            disabled={isLoading || readOnly}
                          />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                          <Textarea
                            placeholder="Enter the plan of action for this point..."
                            value={point.planOfAction || ''}
                            onChange={(e) => {
                              const arr = [...(field.value || [])]
                              arr[index] = { ...arr[index], planOfAction: e.target.value, status: arr[index].status || 'pending' }
                              field.onChange(arr)
                            }}
                            className="min-h-[80px]"
                            disabled={isLoading || readOnly}
                          />
                        </div>
                        <div className="col-span-12 md:col-span-3">
                          {point.accountability === 'client' || (point.accountability && point.accountability !== 'admin' && !point.accountability.startsWith('client:')) ? (
                            // Show client selection when "client" is selected or when a client ID is stored
                            <Popover 
                              open={accountabilityClientOpen[index] || false} 
                              onOpenChange={(open) => setAccountabilityClientOpen({ ...accountabilityClientOpen, [index]: open })}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !point.accountability || point.accountability === 'client' ? "text-muted-foreground" : ""
                                  )}
                                  disabled={isLoading || readOnly}
                                >
                                  {point.accountability && point.accountability !== 'client' && point.accountability !== 'admin' ? (
                                    (() => {
                                      const clientId = point.accountability.startsWith('client:') ? point.accountability.replace('client:', '') : point.accountability
                                      const selectedClient = clients.find((c: any) => c._id === clientId)
                                      return selectedClient ? `${selectedClient.username} (${selectedClient.email})` : 'Select a client'
                                    })()
                                  ) : (
                                    'Select a client'
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    placeholder="Search clients..."
                                    value={accountabilityClientSearch[index] || ''}
                                    onValueChange={(value) => setAccountabilityClientSearch({ ...accountabilityClientSearch, [index]: value })}
                                  />
                                  <CommandList>
                                    <CommandEmpty>No clients found.</CommandEmpty>
                                    <CommandGroup>
                                      {(() => {
                                        const searchValue = (accountabilityClientSearch[index] || '').toLowerCase()
                                        const filtered = searchValue
                                          ? clients.filter((client: any) =>
                                              client.username?.toLowerCase().includes(searchValue) ||
                                              client.email?.toLowerCase().includes(searchValue) ||
                                              client.companyName?.toLowerCase().includes(searchValue) ||
                                              client.companyCode?.toLowerCase().includes(searchValue)
                                            )
                                          : clients
                                        return filtered.map((client: any) => {
                                          const currentClientId = point.accountability?.startsWith('client:') 
                                            ? point.accountability.replace('client:', '') 
                                            : (point.accountability && point.accountability !== 'client' && point.accountability !== 'admin' ? point.accountability : '')
                                          return (
                                            <CommandItem
                                              key={client._id}
                                              value={`${client.username} ${client.email} ${client.companyName || ''} ${client.companyCode || ''}`}
                                              onSelect={() => {
                                                const arr = [...(field.value || [])]
                                                arr[index] = { ...arr[index], accountability: `client:${client._id}`, status: arr[index].status || 'pending' }
                                                field.onChange(arr)
                                                setAccountabilityClientOpen({ ...accountabilityClientOpen, [index]: false })
                                                setAccountabilityClientSearch({ ...accountabilityClientSearch, [index]: '' })
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  currentClientId === client._id ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              {client.username} ({client.email})
                                            </CommandItem>
                                          )
                                        })
                                      })()}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            // Show admin/client select when not showing client selection
                            <Select
                              value={point.accountability === 'admin' || (point.accountability && point.accountability.startsWith('client:')) ? (point.accountability === 'admin' ? 'admin' : 'client') : (point.accountability || '')}
                              onValueChange={(value) => {
                                const arr = [...(field.value || [])]
                                if (value === 'admin') {
                                  arr[index] = { ...arr[index], accountability: 'admin', status: arr[index].status || 'pending' }
                                } else if (value === 'client') {
                                  arr[index] = { ...arr[index], accountability: 'client', status: arr[index].status || 'pending' }
                                }
                                field.onChange(arr)
                              }}
                              disabled={isLoading || readOnly}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select accountability" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="col-span-12 md:col-span-1 flex flex-col items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRemoveConfirmOpen(index)}
                            disabled={isLoading || readOnly}
                            className="text-destructive hover:text-destructive w-full"
                          >
                            Remove
                          </Button>
                          <AlertDialog open={removeConfirmOpen === index} onOpenChange={(open) => !open && setRemoveConfirmOpen(null)}>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Meeting Point?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this meeting point? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    const arr = [...(field.value || [])]
                                    arr.splice(index, 1)
                                    field.onChange(arr)
                                    setRemoveConfirmOpen(null)
                                    // Persist removal in edit mode
                                    if (mode === 'edit' && schedule?._id) {
                                      // Process meetingPoints to strip "client:" prefix from accountability values
                                      const processedArr = arr.map((mp: any) => ({
                                        ...mp,
                                        accountability: mp.accountability?.startsWith('client:') 
                                          ? mp.accountability.replace('client:', '') 
                                          : mp.accountability
                                      }))
                                      updateSchedule({ scheduleId: schedule._id, data: { meetingPoints: processedArr } })
                                    }
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Yes, Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => field.onChange([...(field.value || []), { pointsDiscussed: '', planOfAction: '', accountability: '', status: 'pending' }])}
                      disabled={isLoading || readOnly}
                    >
                      Add New Point
                    </Button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Closure Report */}
          <FormField
            control={form.control}
            name="closureReport"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Closure Report</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter the closure report..."
                    className="min-h-[100px]"
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Other Attendees */}
          <FormField
            control={form.control}
            name="otherAttendees"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Other Attendees Email (seperated by comma)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter names and emails of additional attendees not in the system (one per line)..."
                    className="min-h-[80px]"
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          
        </div>
        </fieldset>

       

        {/* Actions */}
        {!readOnly && (
        <div className="flex justify-between">
          <div>
            {mode === 'edit' && schedule && onToggleDetailPanel && (
              <Button 
                type="button" 
                variant={isDetailPanelOpen ? "outline" : "secondary"}
                onClick={onToggleDetailPanel}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isDetailPanelOpen ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Show Details
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading 
                ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                : (mode === 'create' ? 'Create Meeting' : 'Update Meeting')
              }
            </Button>
          </div>
        </div>
        )}
      </form>
    </Form>
  )
}




