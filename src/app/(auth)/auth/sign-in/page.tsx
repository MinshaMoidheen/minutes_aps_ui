'use client'

import { Card } from '@/components/ui/card'
import { UserAuthForm } from '../components/user-auth-form'

export default function SignIn() {
  return (
    <Card className='p-6'>
      <div className='flex flex-col space-y-4'>
        {/* Header */}
        <div className='flex flex-col space-y-2 text-left'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Login
          </h1>
          <p className='text-sm text-muted-foreground'>
            Enter your email and password below to log into your account
          </p>
        </div>

        {/* Form */}
        <UserAuthForm />

        {/* Sign Up Link */}
        <div className='mt-4 text-center'>
          <p className='text-sm text-muted-foreground'>
            Don't have an account?{' '}
            <a
              href='/auth/sign-up'
              className='font-medium text-primary hover:underline'
            >
              Sign up
            </a>
          </p>
        </div>

        {/* Terms and Privacy */}
        <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
          By clicking login, you agree to our{' '}
          <a
            href='/terms'
            className='underline underline-offset-4 hover:text-primary'
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href='/privacy'
            className='underline underline-offset-4 hover:text-primary'
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </Card>
  )
}
