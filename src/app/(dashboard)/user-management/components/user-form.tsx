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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PasswordInput } from '@/components/password-input'
import { 
  useCreateUserMutation, 
  useUpdateUserMutation,
  useGetAdminsQuery,
  type User
} from '@/store/api/userApi'
import { useAuth } from '@/context/auth-context'
import { toast } from '@/hooks/use-toast'

const workingHoursSchema = z.object({
  punchin: z.object({
    from: z
      .string()
      .min(1, 'Punch in from time is required')
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    to: z
      .string()
      .min(1, 'Punch in to time is required')
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  }),
  punchout: z.object({
    from: z
      .string()
      .min(1, 'Punch out from time is required')
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    to: z
      .string()
      .min(1, 'Punch out to time is required')
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  }),
})

const userFormSchema = z.object({
  username: z
    .string()
    .trim(),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(50, 'Email must be less than 50 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .optional(),
  refAdmin: z
    .string()
    .min(1, 'Admin is required')
    .optional(), // Make optional since it will be set automatically for admin users
  designation: z
    .string()
    .trim()
    .min(1, 'Designation is required')
    .max(50, 'Designation must be less than 50 characters'),
 
})

type UserFormData = z.infer<typeof userFormSchema>

interface UserFormProps {
  mode: 'create' | 'edit'
  user?: User
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ mode, user, onSuccess, onCancel }: UserFormProps) {
  const { user: currentUser } = useAuth()
   const [limit] = useState(2000)
    const [offset, setOffset] = useState(0)
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const { data } =useGetAdminsQuery({ limit, offset }, {
    // Refetch options
    refetchOnMountOrArgChange: true,
  })

  // Check if current user is admin (not superadmin)
  const isAdmin = currentUser?.userType === 'admin'
  const isSuperAdmin = currentUser?.userType === 'superadmin'

  console.log('Current User:', currentUser)
  console.log('Is Admin:', isAdmin)
  console.log('Admins Data:', data)

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username:'',
      email: '',
      password: '',
      refAdmin: isAdmin ? currentUser?._id || '' : '', // Set current admin as refAdmin if user is admin
      designation: '',
     
    },
  })

  // Populate form with user data when editing
  useEffect(() => {
    if (mode === 'edit' && user) {
      const refAdminValue = typeof user.refAdmin === 'object' && user.refAdmin !== null 
        ? user.refAdmin._id 
        : typeof user.refAdmin === 'string' 
          ? user.refAdmin
          : ''
      
      form.reset({
        username: user.username || '',
        email: user.email,
        password: '', // Don't populate password
        refAdmin: refAdminValue,
        designation: user.designation || '',
      })
      
      // Also set the value directly to ensure it updates
      if (refAdminValue) {
        form.setValue('refAdmin', refAdminValue)
      }
    } else if (mode === 'create' && isAdmin) {
      // For admin users creating new users, set their ID as refAdmin
      form.setValue('refAdmin', currentUser?._id || '')
    }
  }, [mode, user, form, isAdmin, currentUser, data])

  const onSubmit = async (data: UserFormData) => {
   
    try {
      if (mode === 'create') {
        if (!data.password) {
          form.setError('password', { message: 'Password is required for new users' })
          return
        }

       
        
        // Ensure refAdmin is set for admin users
        const submitData = { 
          username:data.username,
          email: data.email,
          password: data.password!, // Password is guaranteed to exist here
          refAdmin: isAdmin && currentUser?._id ? currentUser._id : data.refAdmin!,
          designation: data.designation,
         
        }

        console.log("submitData",submitData)

       
        
        await createUser(submitData).unwrap()

            
        toast({
          title: 'User Created',
          description: 'User has been successfully created.',
        })
      } else {
        if (!user) {
          toast({
            title: 'Error',
            description: 'User data not found.',
            variant: 'destructive',
          })
          return
        }
        // Remove password if empty
        const updateData = { ...data }
        if (!updateData.password) {
          delete updateData.password
        }
        
        // Ensure refAdmin is set for admin users during edit
        if (isAdmin && currentUser?._id) {
          updateData.refAdmin = currentUser._id
        }
        
        await updateUser({ userId: user._id, data: updateData }).unwrap()
        toast({
          title: 'User Updated',
          description: 'User has been successfully updated.',
        })
      }
      onSuccess()
    } catch (error: any) {
      toast({
        title: mode === 'create' ? 'Create Failed' : 'Update Failed',
        description: error?.data?.message || `Failed to ${mode} user.`,
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
                  <Input placeholder="user" {...field} />
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
                  <Input placeholder="user@company.com" {...field} />
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

          {/* Admin - Only show for superadmin users */}
          {isSuperAdmin && (
            <FormField
              control={form.control}
              name="refAdmin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an admin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {data?.users?.map((admin) => (
                        <SelectItem key={admin._id} value={admin._id}>
                          {admin.username} - ({admin.company})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          
          {/* Designation */}
          <FormField
            control={form.control}
            name="designation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Designation</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., MANAGER, EMPLOYEE" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

      

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading 
              ? (mode === 'create' ? 'Creating...' : 'Updating...') 
              : (mode === 'create' ? 'Create User' : 'Update User')
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}
