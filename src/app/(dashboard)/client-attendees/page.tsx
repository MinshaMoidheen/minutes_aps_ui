'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Main } from '@/components/ui/main'
import { ClientAttendeesList } from './components/client-attendees-list'
import { ClientAttendeesForm } from './components/client-attendees-form'
import { RoleProtectedRoute } from '@/components/role-protected-route'

// Client Attendee interface (same fields as client + client reference)
export interface ClientAttendee {
  _id: string
  username: string
  email: string
  phoneNumber: string
  clientId: string
  client?: {
    _id: string
    username: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

const topNav = [
  {
    title: 'Client Attendees',
    href: 'client-attendees',
    isActive: true,
    disabled: false,
  },
]

export default function ClientAttendeesPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [editingAttendee, setEditingAttendee] = useState<ClientAttendee | undefined>(undefined)

  const handleEdit = (attendee: ClientAttendee) => {
    setEditingAttendee(attendee)
    setActiveTab('edit')
  }

  const handleSuccess = () => {
    setEditingAttendee(undefined)
    setActiveTab('list')
  }

  const handleCancel = () => {
    setEditingAttendee(undefined)
    setActiveTab('list')
  }

  return (
    <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <Header fixed>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className="p-4 md:p-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="sm:w-auto">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-3">
                <TabsTrigger value="list" className="text-xs sm:text-sm">Attendees List</TabsTrigger>
                <TabsTrigger value="create" className="text-xs sm:text-sm">Create Attendee</TabsTrigger>
                {editingAttendee && <TabsTrigger value="edit" className="text-xs sm:text-sm">Edit Attendee</TabsTrigger>}
              </TabsList>
            </Tabs>
            {activeTab === 'list' && (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  size="sm"
                >
                  Add New Attendee
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {activeTab === 'list' && (
              <Card>
                 
                <CardContent className="p-4 md:p-6">
                  <ClientAttendeesList onEdit={handleEdit} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'create' && (
              <Card>
                {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <ClientAttendeesForm 
                    mode="create" 
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'edit' && editingAttendee && (
              <Card>
                {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <ClientAttendeesForm 
                    mode="edit" 
                    attendee={editingAttendee}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Main>
    </RoleProtectedRoute>
  )
}
