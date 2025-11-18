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
import { MeetingTypeList } from './components/meeting-type-list'
import { MeetingTypeForm } from './components/meeting-type-form'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { MeetingType as MeetingTypeInterface } from '@/store/api/meetingTypeApi'

const topNav = [
  {
    title: 'Meeting Type',
    href: 'meeting-type',
    isActive: true,
    disabled: false,
  },
]

export default function MeetingTypePage() {
  const [activeTab, setActiveTab] = useState('list')
  const [editingMeetingType, setEditingMeetingType] = useState<MeetingTypeInterface | undefined>(undefined)

  const handleEdit = (meetingType: MeetingTypeInterface) => {
    setEditingMeetingType(meetingType)
    setActiveTab('edit')
  }

  const handleSuccess = () => {
    setEditingMeetingType(undefined)
    setActiveTab('list')
  }

  const handleCancel = () => {
    setEditingMeetingType(undefined)
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
                <TabsTrigger value="list" className="text-xs sm:text-sm">Meeting Type List</TabsTrigger>
                <TabsTrigger value="create" className="text-xs sm:text-sm">Create Meeting Type</TabsTrigger>
                {editingMeetingType && <TabsTrigger value="edit" className="text-xs sm:text-sm">Edit Meeting Type</TabsTrigger>}
              </TabsList>
            </Tabs>
            {activeTab === 'list' && (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  size="sm"
                >
                  Add New Meeting Type
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {activeTab === 'list' && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <MeetingTypeList onEdit={handleEdit} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'create' && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <MeetingTypeForm 
                    mode="create" 
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'edit' && editingMeetingType && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <MeetingTypeForm 
                    mode="edit" 
                    meetingType={editingMeetingType}
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

