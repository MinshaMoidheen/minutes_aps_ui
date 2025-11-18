'use client'

import { useState, useEffect } from 'react'
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
import { PasswordInput } from '@/components/password-input'
import { 
  useCreateUserMutation, 
  useUpdateUserMutation,
  type User
} from '@/store/api/userApi'
import { toast } from '@/hooks/use-toast'

const adminFormSchema = z.object({
  username: z
    .string()
    .trim()
    .optional(),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(50, 'Email must be less than 50 characters'),
  password: z
    .string()
    .optional(),
  company: z
    .string()
    .trim()
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
})

type AdminFormData = z.infer<typeof adminFormSchema>

interface AdminFormProps {
  mode: 'create' | 'edit'
  admin?: User
  onSuccess: () => void
  onCancel: () => void
}

export function AdminForm({ mode, admin, onSuccess, onCancel }: AdminFormProps) {
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      company: '',
    },
  })

  // Populate form with admin data when editing
  useEffect(() => {
    if (mode === 'edit' && admin) {
      form.reset({
        username: admin.username,
        email: admin.email,
        password: '', // Don't populate password
        company: admin.company || '',
      })
    }
  }, [mode, admin, form])

  const onSubmit = async (data: AdminFormData) => {
    try {
      if (mode === 'create') {
        // Validate password for create mode
        if (!data.password || data.password.trim() === '') {
          form.setError('password', { message: 'Password is required for new admins' })
          return
        }
        
        if (data.password.length < 8) {
          form.setError('password', { message: 'Password must be at least 8 characters long' })
          return
        }
        
        // Prepare create data with role as 'admin'
        const createData = {
          username: data.username || undefined, // Only send if provided
          email: data.email,
          password: data.password,
          company: data.company || undefined, // Only send if provided
          role: 'admin' as const,
        }

        console.log('Creating admin with data:', createData)
        
        await createUser(createData).unwrap()
        toast({
          title: 'Admin Created',
          description: 'Admin has been successfully created.',
        })
      } else {
        if (!admin) {
          toast({
            title: 'Error',
            description: 'Admin data not found.',
            variant: 'destructive',
          })
          return
        }
        
        // Prepare update data
        const updateData: any = {
          username: data.username,
          email: data.email,
          company: data.company,
        }
        
        // Only include password if provided
        if (data.password && data.password.trim() !== '') {
          updateData.password = data.password
        }
        
        await updateUser({ userId: admin._id, data: updateData }).unwrap()
        toast({
          title: 'Admin Updated',
          description: 'Admin has been successfully updated.',
        })
      }
      onSuccess()
    } catch (error: any) {
      toast({
        title: mode === 'create' ? 'Create Failed' : 'Update Failed',
        description: error?.data?.message || `Failed to ${mode} admin.`,
        variant: 'destructive',
      })
    }
  }

  
  const isLoading = isCreating || isUpdating

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} />
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
                  <Input placeholder="admin@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Company */}
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="Your Company Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Password {mode === 'edit' && '(leave empty to keep current)'}
                </FormLabel>
                <FormControl>
                  <PasswordInput 
                    placeholder={mode === 'edit' ? 'Enter new password' : '********'} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading 
              ? (mode === 'create' ? 'Creating...' : 'Updating...') 
              : (mode === 'create' ? 'Create Admin' : 'Update Admin')
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}
