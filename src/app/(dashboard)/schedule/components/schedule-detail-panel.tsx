'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, Clock, MapPin, Users, FileText, User, Building, X } from 'lucide-react'
import type { Schedule } from '@/store/api/scheduleApi'
import { useGetSchedulesQuery } from '@/store/api/scheduleApi'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface ScheduleDetailPanelProps {
  schedule: Schedule | null
  isOpen: boolean
  onClose: () => void
}

export function ScheduleDetailPanel({ schedule, isOpen, onClose }: ScheduleDetailPanelProps) {
  const router = useRouter()
  
  // Normalize clientId to a string (handle cases where clientId is an object)
  const clientIdForQuery = useMemo(() => {
    const cid: any = (schedule as any)?.clientId
    if (typeof cid === 'string' && cid.trim()) return cid
    if (cid && typeof cid === 'object' && typeof cid._id === 'string') return cid._id
    const clientObj: any = (schedule as any)?.client
    if (clientObj && typeof clientObj._id === 'string') return clientObj._id
    return undefined
  }, [schedule])

  // Fetch previous meetings for the same client
  const { data: previousMeetingsData, isLoading: isLoadingPrevious } = useGetSchedulesQuery({ 
    limit: 50, 
    offset: 0, 
    clientId: clientIdForQuery,
    status: 'previous'
  })

  console.log("previousMeetingsData",previousMeetingsData)
  
  const previousMeetings = previousMeetingsData?.schedules || []

  // Filter out the current meeting and sort by date in descending order (newest first)
  const currentMeetingId = schedule?._id
  const filteredAndSortedMeetings = [...previousMeetings]
    .filter((meeting) => meeting._id !== currentMeetingId)
    .sort((a, b) => {
      const dateA = new Date(a.startDate).getTime()
      const dateB = new Date(b.startDate).getTime()
      return dateB - dateA // Descending order
    })

  if (!isOpen || !schedule) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      incoming: { variant: 'secondary' as const, label: 'Incoming' },
      ongoing: { variant: 'default' as const, label: 'Ongoing' },
      previous: { variant: 'outline' as const, label: 'Previous' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.incoming
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="w-full h-full border-l bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h3 className="font-semibold line-clamp-1">{schedule?.title || 'Meeting Details'}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Current Meeting Details */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{schedule.title}</span>
                {getStatusBadge(schedule.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Start:</span>{' '}
                    {formatDate(schedule.startDate)} at {formatTime(schedule.startTime)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">End:</span>{' '}
                    {formatDate(schedule.endDate)} at {formatTime(schedule.endTime)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Location:</span> {schedule.location}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Client:</span> {schedule.client?.username} ({schedule.client?.email})
                  </div>
                </div>
              </div>

              {(schedule as any).agenda && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    Agenda
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {(schedule as any).agenda}
                  </p>
                </div>
              )}

              {(schedule as any).organizer && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Organizer:</span> {(schedule as any).organizer}
                  </div>
                </div>
              )}

              {(schedule as any).otherAttendees && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    Other Attendees
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {(schedule as any).otherAttendees}
                  </p>
                </div>
              )}

              {(schedule as any).meetingPoints && (schedule as any).meetingPoints.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    Meeting Points
                  </h4>
                  <div className="space-y-2">
                    {(schedule as any).meetingPoints.map((point: any, index: number) => (
                      <div key={index} className="border rounded-md p-2 text-xs">
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <span className="font-medium text-muted-foreground">Points Discussed:</span>
                            <p className="text-sm mt-1">{point.pointsDiscussed || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Plan of Action:</span>
                            <p className="text-sm mt-1">{point.planOfAction || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Accountability:</span>
                            <p className="text-sm mt-1">{point.accountability || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(schedule as any).closureReport && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    Closure Report
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {(schedule as any).closureReport}
                  </p>
                </div>
              )}
            </CardContent>
          </Card> */}

          {/* <Separator /> */}

          {/* Previous Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Previous Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPrevious ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-xs text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : filteredAndSortedMeetings.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {filteredAndSortedMeetings.map((meeting) => (
                    <div key={meeting._id} className="border rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 
                          className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                          onClick={() => router.push(`/schedule/${meeting._id}`)}
                        >
                          {meeting.title}
                        </h4>
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">Date:</span>
                        <span className="text-muted-foreground">{formatDate(meeting.startDate)}</span>
                      </div>
                      
                      {/* Time */}
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">Time:</span>
                        <span className="text-muted-foreground">{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</span>
                      </div>
                      
                      {/* Location */}
                      {meeting.location && (
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Location:</span>
                          <span className="text-muted-foreground">{meeting.location}</span>
                        </div>
                      )}
                      
                      {/* Points Discussed */}
                      {(meeting as any).meetingPoints && (meeting as any).meetingPoints.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-xs font-medium">Points Discussed:</span>
                          <ul className="text-xs list-disc list-inside mt-1 space-y-1">
                            {(meeting as any).meetingPoints.map((point: any, index: number) => {
                              const isComplete = point.status === 'complete'
                              return (
                                <li 
                                  key={index}
                                  className={isComplete ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}
                                >
                                  {point.pointsDiscussed || 'N/A'}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No previous meetings found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
