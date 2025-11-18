'use client'

import { Card } from '@/components/ui/card'
import { AdminSignupForm } from '../components/admin-signup-form'

export default function SignUp() {
  return (
    <Card className='p-6'>
      <div className='flex flex-col space-y-4'>
        {/* Header */}
        <div className='flex flex-col space-y-2 text-left'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Create Admin Account
          </h1>
          <p className='text-sm text-muted-foreground'>
            Fill in the details below to create your admin account
          </p>
        </div>

        {/* Form */}
        <AdminSignupForm />

        {/* Terms and Privacy */}
        <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
          By creating an account, you agree to our{' '}
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

