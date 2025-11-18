'use client'

import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/context/auth-context'
import ReduxProvider from '@/store/ReduxProvider'

export default function AuthLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ReduxProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </AuthProvider>
    </ReduxProvider>
  )
}
