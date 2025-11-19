'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Main } from '@/components/ui/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { useGetScheduleByIdQuery, useUpdateScheduleMutation, type Schedule } from '@/store/api/scheduleApi'
import { ScheduleDetailPanel } from '../components/schedule-detail-panel'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { CheckCircle2, PanelRightOpen } from 'lucide-react'

export default function ScheduleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  const { data, isLoading } = useGetScheduleByIdQuery(id, { skip: !id })
  const schedule = (data as any)?.schedule as Schedule | undefined
  const [updateSchedule, { isLoading: isUpdating }] = useUpdateScheduleMutation()

  // Safely derive a string label for meeting type
  const meetingTypeLabel = (() => {
    const s: any = schedule || {}
    if (s.meetingType && typeof s.meetingType === 'object') {
      return s.meetingType.title || s.meetingType.name || s.meetingType._id || '—'
    }
    if (typeof s.meetingTypeTitle === 'string') return s.meetingTypeTitle
    if (typeof s.meetingTypeName === 'string') return s.meetingTypeName
    const mtId = s.meetingTypeId
    if (typeof mtId === 'string') return mtId
    if (mtId && typeof mtId === 'object') return mtId.title || mtId.name || mtId._id || '—'
    return '—'
  })()

  const handleMarkAsComplete = async (pointIndex: number) => {
    if (!schedule?._id) return

    const meetingPoints = [...((schedule as any).meetingPoints || [])]
    meetingPoints[pointIndex] = {
      ...meetingPoints[pointIndex],
      status: 'complete'
    }

    try {
      await updateSchedule({
        scheduleId: schedule._id,
        data: { meetingPoints }
      }).unwrap()
      toast({
        title: 'Success',
        description: 'Meeting point marked as complete.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to update meeting point status.',
        variant: 'destructive',
      })
    }
  }

  return (
    <RoleProtectedRoute allowedRoles={['user', 'admin', 'superadmin']}>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='px-4 w-full space-y-4 relative'>
          {/* Button to reopen panel when closed */}
          {!isPanelOpen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPanelOpen(true)}
              className="absolute top-0 right-0 flex items-center gap-2 z-10"
            >
              <PanelRightOpen className="h-4 w-4" />
              {/* <span>Show Panel</span> */}
            </Button>
          )}
          {schedule && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Minimal details */}
              <div className='w-full lg:flex-[2]'>
                <Card>
                  <CardHeader>
                    <CardTitle>Meeting Details</CardTitle>
                  </CardHeader>
                  <CardContent className='p-4 md:p-6 space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <div className='text-xs text-muted-foreground'>Title</div>
                        <div className='text-sm font-medium break-words'>{schedule.title || '—'}</div>
                      </div>
                      <div>
                        <div className='text-xs text-muted-foreground'>Meeting Type</div>
                        <div className='text-sm font-medium break-words'>{meetingTypeLabel}</div>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <div className='text-sm font-semibold'>Meeting Points</div>
                      {Array.isArray((schedule as any).meetingPoints) && (schedule as any).meetingPoints.length > 0 ? (
                        <div className='rounded-md border overflow-x-auto'>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className='w-[30%]'>Points Discussed</TableHead>
                                <TableHead className='w-[30%]'>Plan of Action</TableHead>
                                <TableHead className='w-[25%]'>Accountability</TableHead>
                                {schedule.status !== 'incoming' && (
                                  <TableHead className='w-[15%]'>Actions</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(schedule as any).meetingPoints.map((mp: any, idx: number) => {
                                const isComplete = mp.status === 'complete'
                                return (
                                  <TableRow key={idx} className={isComplete ? 'bg-green-50' : ''}>
                                    <TableCell className={`align-top whitespace-pre-wrap break-words text-sm ${isComplete ? 'bg-green-50' : ''}`}>{mp.pointsDiscussed || '—'}</TableCell>
                                    <TableCell className={`align-top whitespace-pre-wrap break-words text-sm ${isComplete ? 'bg-green-50' : ''}`}>{mp.planOfAction || '—'}</TableCell>
                                    <TableCell className={`align-top whitespace-pre-wrap break-words text-sm ${isComplete ? 'bg-green-50' : ''}`}>{mp.accountability || '—'}</TableCell>
                                    {schedule.status !== 'incoming' && (
                                      <TableCell className={`align-top ${isComplete ? 'bg-green-50' : ''}`}>
                                        {!isComplete ? (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleMarkAsComplete(idx)}
                                            disabled={isUpdating}
                                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                          >
                                           <CheckCircle2 className="h-5 w-5" />
                                          </Button>
                                        ) : (
                                          <span className="text-sm text-green-600 font-medium">Complete</span>
                                        )}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className='text-sm text-muted-foreground'>No meeting points added.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Right: detail panel with previous meetings */}
              {isPanelOpen && (
                <div className='w-full lg:flex-1 lg:min-w-[360px] lg:max-w-[480px]'>
                  <ScheduleDetailPanel
                    schedule={schedule}
                    isOpen={true}
                    onClose={() => setIsPanelOpen(false)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Main>
    </RoleProtectedRoute>
  )
}


