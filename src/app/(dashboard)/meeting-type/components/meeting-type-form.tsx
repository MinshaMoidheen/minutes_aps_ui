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
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { MeetingType, useCreateMeetingTypeMutation, useUpdateMeetingTypeMutation } from '@/store/api/meetingTypeApi'

const meetingTypeFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
})

type MeetingTypeFormData = z.infer<typeof meetingTypeFormSchema>

interface MeetingTypeFormProps {
  mode: 'create' | 'edit'
  meetingType?: MeetingType
  onSuccess: () => void
  onCancel: () => void
}

export function MeetingTypeForm({ mode, meetingType, onSuccess, onCancel }: MeetingTypeFormProps) {
  const [createMeetingType, { isLoading: isCreating }] = useCreateMeetingTypeMutation()
  const [updateMeetingType, { isLoading: isUpdating }] = useUpdateMeetingTypeMutation()

  const form = useForm<MeetingTypeFormData>({
    resolver: zodResolver(meetingTypeFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  // Populate form with meeting type data when editing
  useEffect(() => {
    if (mode === 'edit' && meetingType) {
      form.reset({
        title: meetingType.title,
        description: meetingType.description || '',
      })
    }
  }, [mode, meetingType, form])

  const onSubmit = async (data: MeetingTypeFormData) => {
    try {
      if (mode === 'create') {
        await createMeetingType({
          title: data.title,
          description: data.description,
        }).unwrap()
        toast({
          title: 'Meeting Type Created',
          description: 'Meeting type has been successfully created.',
        })
      } else {
        if (!meetingType) {
          toast({
            title: 'Update Failed',
            description: 'Meeting type data not found.',
            variant: 'destructive',
          })
          return
        }
        
        await updateMeetingType({ 
          meetingTypeId: meetingType._id, 
          data: {
            title: data.title,
            description: data.description,
          }
        }).unwrap()
        toast({
          title: 'Meeting Type Updated',
          description: 'Meeting type has been successfully updated.',
        })
      }
      
      onSuccess()
    } catch (error: any) {
      toast({
        title: mode === 'create' ? 'Create Failed' : 'Update Failed',
        description: error?.data?.message || `Failed to ${mode} meeting type.`,
        variant: 'destructive',
      })
    }
  }

  const isLoading = isCreating || isUpdating

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Team Meeting" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter a brief description of this meeting type..." 
                  {...field} 
                  disabled={isLoading}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
              : (mode === 'create' ? 'Create Type' : 'Update Type')
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}


