'use client'

import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Main } from '@/components/ui/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { useGetScheduleByIdQuery, type Schedule } from '@/store/api/scheduleApi'
import { ScheduleDetailPanel } from '../components/schedule-detail-panel'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function ScheduleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''

  const { data, isLoading } = useGetScheduleByIdQuery(id, { skip: !id })
  const schedule = (data as any)?.schedule as Schedule | undefined

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
        <div className='px-4 w-full space-y-4'>
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
                                <TableHead className='w-[35%]'>Points Discussed</TableHead>
                                <TableHead className='w-[35%]'>Plan of Action</TableHead>
                                <TableHead className='w-[30%]'>Accountability</TableHead>
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
              <div className='w-full lg:flex-1 lg:min-w-[360px] lg:max-w-[480px]'>
                <ScheduleDetailPanel
                  schedule={schedule}
                  isOpen={true}
                  onClose={() => router.back()}
                />
              </div>
            </div>
          )}
        </div>
      </Main>
    </RoleProtectedRoute>
  )
}


