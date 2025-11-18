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
import { useGetClientsQuery } from '@/store/api/clientApi'
import { useGetClientAttendeesQuery } from '@/store/api/clientAttendeesApi'
import { useGetMeetingTypesQuery } from '@/store/api/meetingTypeApi'
import { useCreateScheduleMutation, useUpdateScheduleMutation } from '@/store/api/scheduleApi'
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

  const { data: clientsData } = useGetClientsQuery({ limit: 100, offset: 0 })
  
  const selectedClientId = form.watch('clientId')
  const { data: attendeesResp } = useGetClientAttendeesQuery({ 
    limit: 100, 
    offset: 0,
    clientId: selectedClientId || undefined 
  })


  // Populate form with schedule data when editing
  useEffect(() => {
    if (mode === 'edit' && schedule) {
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
      const meetingTypeId = typeof (schedule as any).meetingTypeId === 'object' 
        ? (schedule as any).meetingTypeId?._id 
        : (schedule as any).meetingTypeId
        
      // Extract clientId - it might be an object if populated or a string
      const clientId = typeof schedule.clientId === 'object'
        ? (schedule.clientId as any)?._id
        : schedule.clientId

      const attendeeIdsFromSchedule = Array.isArray((schedule as any).attendeeIds)
        ? (schedule as any).attendeeIds
            .map((v: any) => (typeof v === 'string' ? v : v?._id))
            .filter((v: any) => typeof v === 'string' && v.trim())
        : Array.isArray((schedule as any).attendees)
        ? (schedule as any).attendees
            .map((a: any) => a?._id)
            .filter((v: any) => typeof v === 'string' && v.trim())
        : []

      const formData = {
        title: schedule.title || '',
        meetingTypeId: meetingTypeId || '',   
        startDate: formatDateForInput(schedule.startDate),
        endDate: formatDateForInput(schedule.endDate),
        startTime: schedule.startTime || '',
        endTime: schedule.endTime || '',
        location: schedule.location || '',
        clientId: clientId || '',
        attendeeIds: attendeeIdsFromSchedule,
        agenda: (schedule as any).agenda || '',
        meetingPoints: ((schedule as any).meetingPoints || []).map((mp: any) => ({
          ...mp,
          status: mp.status || 'pending'
        })),
        closureReport: (schedule as any).closureReport || '',
        otherAttendees: (schedule as any).otherAttendees || '',
        organizer: (schedule as any).organizer || '',
      }
      
      console.log('Form reset data:', formData)
      console.log('Schedule data:', schedule)
      console.log('MeetingTypeId extracted:', meetingTypeId)
      console.log('ClientId extracted:', clientId)
      
      form.reset(formData)
    }
  }, [mode, schedule])

  const { data: meetingTypesData } = useGetMeetingTypesQuery({ limit: 100, offset: 0 })
  const [createSchedule, { isLoading: isCreating }] = useCreateScheduleMutation()
  const [updateSchedule, { isLoading: isUpdating }] = useUpdateScheduleMutation()

  const onSubmit = async (data: IncomingScheduleFormData) => {
    try {
      // Convert date to ISO datetime format
      const startDateTime = new Date(`${data.startDate}T00:00:00Z`).toISOString()
      const endDateTime = new Date(`${data.endDate}T00:00:00Z`).toISOString()
      
      const scheduleData = {
        title: data.title,
        meetingTypeId: data.meetingTypeId || undefined,
        startDate: startDateTime,
        endDate: endDateTime,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        clientId: data.clientId,
        attendeeIds: data.attendeeIds || [],
        agenda: data.agenda || '',
        meetingPoints: data.meetingPoints,
        closureReport: data.closureReport,
        otherAttendees: data.otherAttendees,
        organizer: data.organizer,
      }
      
      console.log('Sending schedule data:', scheduleData)
      
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

  // Helper functions for select all/deselect all
  const handleSelectAll = () => {
    form.setValue('attendeeIds', filteredAttendeeIds)
  }

  const handleDeselectAll = () => {
    form.setValue('attendeeIds', [])
  }

  const selectedAttendees = form.watch('attendeeIds') || []

  // Filter attendees based on selected client (already filtered by API, but keep for safety)
  const filteredAttendees = useMemo(() => {
    return attendeesResp?.data?.attendees || []
  }, [attendeesResp?.data?.attendees])
  
  const filteredAttendeeIds = useMemo(() => {
    return filteredAttendees.map((attendee: any) => attendee._id)
  }, [filteredAttendees])
  
  const isAllSelected = selectedAttendees.length === filteredAttendeeIds.length && filteredAttendeeIds.length > 0
  const isNoneSelected = selectedAttendees.length === 0
  
  // Update attendeeIds when client changes
  useEffect(() => {
    if (selectedClientId && mode === 'create') {
      form.setValue('attendeeIds', filteredAttendeeIds)
    }
  }, [selectedClientId, filteredAttendeeIds, mode, form])

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

            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select key={`client-${field.value || 'none'}`} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(clientsData as any)?.data?.clients?.map((client: any) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.username} ({client.email})
                        </SelectItem>
                      )) || clientsData?.clients?.map((client: any) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.username} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Attendees</FormLabel>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isLoading || isAllSelected}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={isLoading || isNoneSelected}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <FormField
              control={form.control}
              name="attendeeIds"
              render={({ field }) => (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto border rounded-md p-4">
                    {filteredAttendees.length === 0 ? (
                      <div className="col-span-2 text-center text-muted-foreground py-8">
                        {selectedClientId ? 'No attendees found for selected client' : 'Please select a client first'}
                      </div>
                    ) : (
                      filteredAttendees.map((attendee) => (
                      <div key={attendee._id} className="flex items-start space-x-3">
                        <Checkbox
                          id={`attendee-${attendee._id}`}
                          checked={(field.value || []).includes(attendee._id)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || []
                            const newValue = checked
                              ? [...currentValue, attendee._id]
                              : currentValue.filter((value: string) => value !== attendee._id)
                            field.onChange(newValue)
                          }}
                          disabled={isLoading}
                        />
                        <label
                          htmlFor={`attendee-${attendee._id}`}
                          className="space-y-1 leading-none cursor-pointer"
                        >
                          <div className="text-sm font-medium">
                            {attendee.username}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {attendee.email}
                          </p>
                        </label>
                      </div>
                    )))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {selectedAttendees.length} of {filteredAttendeeIds.length} attendees selected
                  </div>
                  <FormMessage />
                </>
              )}
            />
          </div>

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
                          <Textarea
                            placeholder="Who is accountable?"
                            value={point.accountability || ''}
                            onChange={(e) => {
                              const arr = [...(field.value || [])]
                              arr[index] = { ...arr[index], accountability: e.target.value, status: arr[index].status || 'pending' }
                              field.onChange(arr)
                            }}
                            className="min-h-[80px]"
                            disabled={isLoading || readOnly}
                          />
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
                                      updateSchedule({ scheduleId: schedule._id, data: { meetingPoints: arr } })
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
                <FormLabel>Other Attendees</FormLabel>
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




