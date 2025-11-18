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
import { toast } from '@/hooks/use-toast'
import { 
  useCreateClientMutation, 
  useUpdateClientMutation,
  type Client
} from '@/store/api/clientApi'

const clientFormSchema = z.object({
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
})

type ClientFormData = z.infer<typeof clientFormSchema>

interface ClientFormProps {
  mode: 'create' | 'edit'
  client?: Client
  onSuccess: () => void
  onCancel: () => void
}

export function ClientForm({ mode, client, onSuccess, onCancel }: ClientFormProps) {
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation()
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      username: '',
      email: '',
      phoneNumber: '',
    },
  })

  // Populate form with client data when editing
  useEffect(() => {
    if (mode === 'edit' && client) {
      form.reset({
        username: client.username,
        email: client.email,
        phoneNumber: client.phoneNumber,
      })
    }
  }, [mode, client, form])

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (mode === 'create') {
        await createClient(data).unwrap()
        toast({
          title: 'Client Created',
          description: 'Client has been successfully created.',
        })
      } else {
        if (!client) {
          toast({
            title: 'Error',
            description: 'Client data not found.',
            variant: 'destructive',
          })
          return
        }
        
        await updateClient({ clientId: client._id, data }).unwrap()
        toast({
          title: 'Client Updated',
          description: 'Client has been successfully updated.',
        })
      }
      
      onSuccess()
    } catch (error: any) {
      toast({
        title: mode === 'create' ? 'Create Failed' : 'Update Failed',
        description: error?.data?.message || `Failed to ${mode} client.`,
        variant: 'destructive',
      })
    }
  }

  const isLoading = isCreating || isUpdating

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
                    placeholder="john_doe" 
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
                    placeholder="john.doe@example.com" 
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
              <FormItem className="md:col-span-2">
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+1 (555) 123-4567" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
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
              : (mode === 'create' ? 'Create Client' : 'Update Client')
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}
