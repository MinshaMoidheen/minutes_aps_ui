'use client'

import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/context/auth-context'
import { useCreateUserMutation } from '@/store/api/userApi'
import { toast } from '@/hooks/use-toast'

type AdminSignupFormProps = HTMLAttributes<HTMLDivElement>


const signupFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .max(20, 'Username must be less than 20 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(50, 'Email must be less than 50 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  company: z
    .string()
    .trim()
    .min(1, 'Company is required')
    .max(100, 'Company name must be less than 100 characters'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
)

export function AdminSignupForm({ className, ...props }: AdminSignupFormProps) {
  const { login } = useAuth()
  const [createUserMutation, { isLoading }] = useCreateUserMutation()

  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      company: '',
    },
  })

  async function onSubmit(data: z.infer<typeof signupFormSchema>) {
    try {
      // Call user creation API using RTK Query with role 'admin'
      await createUserMutation({
        username: data.username,
        email: data.email,
        password: data.password,
        company: data.company,
        role: 'admin',
      }).unwrap()

      toast({
        title: 'Account Created Successfully',
        description: 'Your admin account has been created. Please log in.',
      })

      // Auto-login after successful signup
      await login(data.email, data.password)
      
    } catch (error: any) {
      console.error('Signup error:', error)
      toast({
        title: 'Signup Failed',
        description: error?.data?.message || error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      })
    }
  }


  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-4'>
            {/* Username Field */}
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder='johndoe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='john@company.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Field */}
            <FormField
              control={form.control}
              name='company'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder='Your Company Name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Fields */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder='********' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder='********' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button className='mt-2' disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Login Link */}
      <div className='text-center'>
        <p className='text-sm text-muted-foreground'>
          Already have an account?{' '}
          <Link
            href='/auth/sign-in'
            className='font-medium text-primary hover:underline'
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
