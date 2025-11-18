'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, MapPin, Users, FileText, User, Building } from 'lucide-react'
import { Schedule } from '../page'
import { useGetSchedulesQuery } from '@/store/api/scheduleApi'

interface ScheduleDetailModalProps {
  schedule: Schedule | null
  isOpen: boolean
  onClose: () => void
}

export function ScheduleDetailModal({ schedule, isOpen, onClose }: ScheduleDetailModalProps) {
  // Fetch previous meetings for the same client
  const { data: previousMeetingsData, isLoading: isLoadingPrevious } = useGetSchedulesQuery({ 
    limit: 50, 
    offset: 0, 
    clientId: schedule?.clientId || '',
    status: 'previous'
  })
  
  const previousMeetings = previousMeetingsData?.schedules || []

  if (!schedule) return null

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meeting Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about the selected meeting and previous meetings with this client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Meeting Details */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{schedule.title}</span>
                {getStatusBadge(schedule.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Start:</strong> {formatDate(schedule.startDate)} at {formatTime(schedule.startTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>End:</strong> {formatDate(schedule.endDate)} at {formatTime(schedule.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Location:</strong> {schedule.location}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Client:</strong> {schedule.client?.username} ({schedule.client?.email})
                  </span>
                </div>
              </div>

              {(schedule as any).agenda && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Agenda
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {(schedule as any).agenda}
                  </p>
                </div>
              )}

              {(schedule as any).organizer && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Organizer:</strong> {(schedule as any).organizer}
                  </span>
                </div>
              )}

              {(schedule as any).otherAttendees && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
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
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Meeting Points
                  </h4>
                  <div className="space-y-3">
                    {(schedule as any).meetingPoints.map((point: any, index: number) => (
                      <div key={index} className="border rounded-md p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <h5 className="text-sm font-medium text-muted-foreground">Points Discussed</h5>
                            <p className="text-sm">{point.pointsDiscussed || 'N/A'}</p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-muted-foreground">Plan of Action</h5>
                            <p className="text-sm">{point.planOfAction || 'N/A'}</p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-muted-foreground">Accountability</h5>
                            <p className="text-sm">{point.accountability || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(schedule as any).closureReport && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Closure Report
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {(schedule as any).closureReport}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator /> */}

          {/* Previous Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Previous Meetings with {schedule.client?.username}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPrevious ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading previous meetings...</p>
                </div>
              ) : previousMeetings.length > 0 ? (
                <div className="space-y-4">
                  {previousMeetings.map((meeting) => (
                    <div key={meeting._id} className="border rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{meeting.title}</h4>
                        {getStatusBadge(meeting.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                        <div>
                          <strong>Date:</strong> {formatDate(meeting.startDate)}
                        </div>
                        <div>
                          <strong>Time:</strong> {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                        </div>
                      </div>
                      {(meeting as any).agenda && (
                        <div className="mb-2">
                          <strong className="text-sm">Agenda:</strong>
                          <p className="text-sm text-muted-foreground">{(meeting as any).agenda}</p>
                        </div>
                      )}
                      {(meeting as any).meetingPoints && (meeting as any).meetingPoints.length > 0 && (
                        <div className="mb-2">
                          <strong className="text-sm">Key Points:</strong>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {(meeting as any).meetingPoints.map((point: any, index: number) => (
                              <li key={index}>{point.pointsDiscussed}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(meeting as any).closureReport && (
                        <div>
                          <strong className="text-sm">Closure Report:</strong>
                          <p className="text-sm text-muted-foreground">{(meeting as any).closureReport}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No previous meetings found for this client</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
