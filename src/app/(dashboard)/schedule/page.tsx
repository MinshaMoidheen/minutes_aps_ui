'use client'

import { useState } from 'react'
import { useGetSchedulesQuery } from '@/store/api/scheduleApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Main } from '@/components/ui/main'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { IncomingScheduleForm } from './components/incoming-schedule-form'
import { IncomingScheduleList } from './components/incoming-schedule-list'

export type { Schedule }

// Export Schedule type for components
export interface Schedule {
  _id: string
  title: string
  description: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
  clientId: string
  client?: {
    _id: string
    username: string
    email: string
  }
  attendeeIds: string[]
  attendees?: Array<{
    _id: string
    username: string
    email: string
  }>
  status: 'incoming' | 'ongoing' | 'previous'
  createdAt: string
  updatedAt: string
}

const topNav = [
  {
    title: 'All Meetings',
    href: 'schedule',
    isActive: true,
    disabled: false,
  },
]

export default function MeetingsPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [selectedStatus, setSelectedStatus] = useState<'incoming' | 'ongoing' | 'previous'>('ongoing')
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>(undefined)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  // Fetch counts per status (use tiny limit; rely on total)
  const { data: incomingCountData } = useGetSchedulesQuery({ limit: 1, offset: 0, status: 'incoming' })
  const { data: ongoingCountData } = useGetSchedulesQuery({ limit: 1, offset: 0, status: 'ongoing' })
  const { data: previousCountData } = useGetSchedulesQuery({ limit: 1, offset: 0, status: 'previous' })
  const incomingTotal = incomingCountData?.total ?? 0
  const ongoingTotal = ongoingCountData?.total ?? 0
  const previousTotal = previousCountData?.total ?? 0

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setActiveTab('edit')
  }

  const handleSuccess = () => {
    setEditingSchedule(undefined)
    setActiveTab('list')
  }

  const handleCancel = () => {
    setEditingSchedule(undefined)
    setActiveTab('list')
  }


  return (
    <RoleProtectedRoute allowedRoles={['user', 'admin', 'superadmin']}>
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
                <TabsTrigger value="list" className="text-xs sm:text-sm">All Meetings</TabsTrigger>
                <TabsTrigger value="create" className="text-xs sm:text-sm">Create Meeting</TabsTrigger>
                {editingSchedule && <TabsTrigger value="edit" className="text-xs sm:text-sm">Edit Meeting</TabsTrigger>}
              </TabsList>
            </Tabs>
            {activeTab === 'list' && (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  size="sm"
                >
                  Add New Meeting
                </Button>
              </div>
            )}
          </div>

          {/* Status Filter */}
          {activeTab === 'list' && (
            <div className="mb-4 flex items-center space-x-2">
              <Button
                variant={selectedStatus === 'ongoing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('ongoing')}
              >
                Ongoing ({ongoingTotal})
              </Button>
              <Button
                variant={selectedStatus === 'incoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('incoming')}
              >
                Upcoming ({incomingTotal})
              </Button>
             
              <Button
                variant={selectedStatus === 'previous' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('previous')}
              >
                Previous ({previousTotal})
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {activeTab === 'list' && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <IncomingScheduleList onEdit={handleEdit} status={selectedStatus} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'create' && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <IncomingScheduleForm 
                    mode="create" 
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                    onViewDetails={undefined}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'edit' && editingSchedule && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <IncomingScheduleForm 
                    mode="edit" 
                    schedule={editingSchedule}
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
