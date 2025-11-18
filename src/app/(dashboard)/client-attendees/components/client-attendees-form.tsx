'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { toast } from '@/hooks/use-toast'
import { ClientAttendee } from '../page'
import { useGetClientsQuery } from '@/store/api/clientApi'
import { 
  useCreateClientAttendeeMutation,
  useUpdateClientAttendeeMutation,
} from '@/store/api/clientAttendeesApi'

const attendeeFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(50, 'Email must be less than 50 characters'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits'),
  clientId: z
    .string()
    .min(1, 'Client is required'),
})

type AttendeeFormData = z.infer<typeof attendeeFormSchema>

interface ClientAttendeesFormProps {
  mode: 'create' | 'edit'
  attendee?: ClientAttendee
  onSuccess: () => void
  onCancel: () => void
}

export function ClientAttendeesForm({ mode, attendee, onSuccess, onCancel }: ClientAttendeesFormProps) {
  const { data: clientsData } = useGetClientsQuery({ limit: 1000, offset: 0 })
  const [createAttendee, { isLoading: isCreating }] = useCreateClientAttendeeMutation()
  const [updateAttendee, { isLoading: isUpdating }] = useUpdateClientAttendeeMutation()

  console.log('Clients Data:', clientsData)

  const form = useForm<AttendeeFormData>({
    resolver: zodResolver(attendeeFormSchema),
    defaultValues: {
      username: '',
      email: '',
      phoneNumber: '',
      clientId: '',
    },
  })

  // Populate form with attendee data when editing
  useEffect(() => {
    if (mode === 'edit' && attendee) {
      // Handle clientId - it might be a string or populated object
      const clientIdValue = (attendee.clientId && typeof attendee.clientId === 'object' && '_id' in attendee.clientId)
        ? (attendee.clientId as any)._id
        : typeof attendee.clientId === 'string'
          ? attendee.clientId
          : ''
      
      form.reset({
        username: attendee.username || '',
        email: attendee.email || '',
        phoneNumber: attendee.phoneNumber || '',
        clientId: clientIdValue,
      })
      
      // Also set the value directly to ensure it updates
      if (clientIdValue) {
        form.setValue('clientId', clientIdValue)
      }
    }
  }, [mode, attendee, form, clientsData])

  const onSubmit = async (data: AttendeeFormData) => {
    try {
      if (mode === 'create') {
        await createAttendee({
          username: data.username,
          email: data.email,
          phoneNumber: data.phoneNumber,
          clientId: data.clientId,
        }).unwrap()
        toast({
          title: 'Attendee Created',
          description: `${data.username} has been created successfully.`,
        })
      } else {
        if (!attendee) {
          toast({
            title: 'Update Failed',
            description: 'Attendee data not found.',
            variant: 'destructive',
          })
          return
        }
        await updateAttendee({ attendeeId: attendee._id, data }).unwrap()
        toast({
          title: 'Attendee Updated',
          description: `${data.username} has been updated successfully.`,
        })
      }
      onSuccess()
    } catch (error: any) {
      toast({
        title: mode === 'create' ? 'Create Failed' : 'Update Failed',
        description: error?.data?.message || `Failed to ${mode} attendee.`,
        variant: 'destructive',
      })
    }
  }

  const isLoading = isCreating || isUpdating || form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="alex_johnson" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="alex.johnson@company.com" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+1 (555) 111-2222" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Client Selection */}
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {((clientsData as any)?.data?.clients || []).map((client: any) => (
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
        </div>

       

        {/* Actions */}
        <div className="flex justify-end space-x-2">
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
              : (mode === 'create' ? 'Create Attendee' : 'Update Attendee')
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}
