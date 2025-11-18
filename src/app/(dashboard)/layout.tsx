'use client'

import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { SearchProvider } from '@/context/search-context'
import { AuthProvider } from '@/context/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { cn } from '@/lib/utils'
import ReduxProvider from '@/store/ReduxProvider'

const inter = Inter({ subsets: ['latin'] })

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div>
          <ReduxProvider>
            <AuthProvider>
              <ProtectedRoute allowedUserTypes={['user', 'admin', 'superadmin']}>
                <SidebarProvider>
                  <SearchProvider>
                    <AppSidebar />
                    <div
                      id='content'
                      className={cn(
                        'max-w-full w-full ml-auto',
                        'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
                        'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
                        'transition-[width] ease-linear duration-200',
                        'h-screen overflow-y-auto',
                        'group-data-[scroll-locked=1]/body:h-full',
                        'group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh'
                      )}
                    >
                      {children}
                    </div>
                  </SearchProvider>
                </SidebarProvider>
              </ProtectedRoute>
            </AuthProvider>
          </ReduxProvider>
        </div>
      </ThemeProvider>
    </div>
  )
}
