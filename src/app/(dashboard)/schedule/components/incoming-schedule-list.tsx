'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Search, Edit, Trash2, Eye, Calendar, Clock, MapPin, FileText, Mail, Users, CheckCircle2 } from 'lucide-react'
import type { Schedule } from '@/store/api/scheduleApi'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useGetSchedulesQuery, useDeleteScheduleMutation, useUpdateScheduleMutation } from '@/store/api/scheduleApi'
import { useGetClientAttendeesQuery } from '@/store/api/clientAttendeesApi'
import { useGetCommonClientsQuery } from '@/store/api/clientApi'
import employeesJson from '@/data/employees.json'
import { ScheduleDetailModal } from './schedule-detail-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Integrated: load from API

interface IncomingScheduleListProps {
  onEdit: (schedule: Schedule) => void
  status?: 'incoming' | 'ongoing' | 'previous'
}

export function IncomingScheduleList({ onEdit, status = 'incoming' }: IncomingScheduleListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null)
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)
  const [emailPreviewData, setEmailPreviewData] = useState<{
    schedule: any
    emailAddresses: string[]
    html: string
    subject: string
    clientEmail?: string
    attendeeEmails?: string[]
  } | null>(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [recipientsPreviewOpen, setRecipientsPreviewOpen] = useState(false)
  const [recipientsData, setRecipientsData] = useState<{
    clientEmail?: string
    attendeeEmails?: string[]
    otherAttendees?: string[]
  } | null>(null)
  const [meetingPointsModalOpen, setMeetingPointsModalOpen] = useState(false)
  const [selectedScheduleForPoints, setSelectedScheduleForPoints] = useState<any | null>(null)
  
  const { data, isLoading, error, refetch } = useGetSchedulesQuery({ limit: 20, offset: 0, status: status })
  const [deleteSchedule, { isLoading: isDeleting }] = useDeleteScheduleMutation()
  const [updateSchedule, { isLoading: isUpdatingPoints }] = useUpdateScheduleMutation()
  const schedules: any[] = data?.schedules || []
  const { data: attendeesData } = useGetClientAttendeesQuery({ limit: 1000, offset: 0 })
  const { data: clientsData } = useGetCommonClientsQuery({ limit: 1000, offset: 0 })

  // Get clients and attendees data for email lookup
  const clients = useMemo(() => {
    return (clientsData as any)?.data?.clients || clientsData?.clients || []
  }, [clientsData])
  
  const attendees = useMemo(() => {
    return (attendeesData as any)?.data?.attendees || []
  }, [attendeesData])

  console.log("schedules",data)

  // Filter schedules based on search term
  const filteredSchedules = useMemo(() => {
    if (!searchTerm) return schedules

    const term = searchTerm.toLowerCase()
    return schedules.filter((schedule: any) => {
      const title = (schedule.title || '').toLowerCase()
      const agenda = (schedule.agenda || '').toLowerCase()
      const location = (schedule.location || '').toLowerCase()
      
      // Handle client data - check both populated object and separate client field
      const clientUser = (
        (typeof schedule.clientId === 'object' && schedule.clientId?.username) ||
        schedule.client?.username ||
        ''
      ).toLowerCase()
      const clientEmail = (
        (typeof schedule.clientId === 'object' && schedule.clientId?.email) ||
        schedule.client?.email ||
        ''
      ).toLowerCase()
      
      return (
        title.includes(term) ||
        agenda.includes(term) ||
        location.includes(term) ||
        clientUser.includes(term) ||
        clientEmail.includes(term)
      )
    })
  }, [schedules, searchTerm])

  const handleDelete = async (schedule: any) => {
    try {
      await deleteSchedule(schedule._id).unwrap()
      toast({
        title: 'Schedule Deleted',
        description: `${schedule.title} has been deleted successfully.`,
      })
      setDeleteConfirmOpen(null)
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error?.data?.message || `Failed to delete ${schedule.title}. Please try again.`,
        variant: 'destructive',
      })
    }
  }

  const handleView = (schedule: any) => {
    setSelectedSchedule(schedule)
    setIsDetailModalOpen(true)
  }

  const handleStart = (schedule: any) => {
    // Mock start functionality
    toast({
      title: 'Schedule Started',
      description: `${schedule.title} has been started.`,
    })
  }

  // Function to extract recipients from schedule
  const extractRecipients = (schedule: any) => {
    const emailAddresses: string[] = []
    let clientEmail: string | null = null
    const attendeeEmails: string[] = []
    const otherAttendees: string[] = []
    
    console.log("extractRecipients - Full schedule:", schedule)
      console.log("handleSendEmail - clientId:", schedule.clientId)
      console.log("handleSendEmail - attendeeIds:", schedule.attendeeIds)
      console.log("handleSendEmail - clients available:", clients.length)
      console.log("handleSendEmail - attendees available:", attendees.length)
      
      // Get employees from JSON file
      const employees = (employeesJson as any).employees || []
      console.log("handleSendEmail - employees available:", employees.length)
      
      // Get client email
      if (schedule.clientId) {
        // Check if clientId is a populated object with email
        if (typeof schedule.clientId === 'object' && schedule.clientId !== null && schedule.clientId.email) {
          clientEmail = schedule.clientId.email
          console.log("Found client email from populated object:", clientEmail)
        } 
        // Check if client is populated separately
        else if (schedule.client?.email) {
          clientEmail = schedule.client.email
          console.log("Found client email from client field:", clientEmail)
        }
        // Check if clientId is already an email (saved as email)
        else if (typeof schedule.clientId === 'string' && schedule.clientId.includes('@')) {
          clientEmail = schedule.clientId
          console.log("clientId is already an email:", clientEmail)
        }
        // Otherwise, try to find client by ID from fetched clients data
        else {
          const clientId = typeof schedule.clientId === 'object' && schedule.clientId !== null
            ? schedule.clientId._id || schedule.clientId 
            : schedule.clientId
          
          console.log("Looking up client by _id:", clientId)
          
          if (clientId) {
            // Look up client in fetched clients data by _id
            const client = clients.find((c: any) => 
              c._id === clientId || c._id?.toString() === clientId?.toString()
            )
            console.log("Found client:", client)
            if (client && client.email) {
              clientEmail = client.email
              console.log("Found client email from lookup:", clientEmail)
            } else {
              console.warn("Client not found or no email for clientId:", clientId)
            }
          }
        }
        
        if (clientEmail && !emailAddresses.includes(clientEmail)) {
          emailAddresses.push(clientEmail)
        } else if (!clientEmail) {
          console.warn("Could not extract client email")
        }
      } else {
        console.warn("No clientId in schedule")
      }
      
      // Get attendee emails from JSON or API data
      if (schedule.attendeeIds && Array.isArray(schedule.attendeeIds)) {
        console.log("Processing attendeeIds array:", schedule.attendeeIds)
        schedule.attendeeIds.forEach((attendeeId: any, index: number) => {
          let attendeeEmail: string | null = null
          console.log(`Processing attendee ${index}:`, attendeeId)
          
          // Check if attendeeId is a populated object with email
          if (typeof attendeeId === 'object' && attendeeId !== null && attendeeId.email) {
            attendeeEmail = attendeeId.email
            console.log(`Found attendee email from populated object:`, attendeeEmail)
          } 
          // Check if attendeeId is already an email (saved as email)
          else if (typeof attendeeId === 'string' && attendeeId.includes('@')) {
            attendeeEmail = attendeeId
            console.log(`attendeeId is already an email:`, attendeeEmail)
          } 
          // Otherwise, try to find attendee by ID
          else {
            // Extract ID from object or use string ID
            const id = typeof attendeeId === 'object' && attendeeId !== null
              ? attendeeId._id || attendeeId 
              : attendeeId
              
            console.log(`Looking up attendee by _id:`, id)
            
            if (id) {
              // First try API data (client attendees)
              const attendee = attendees.find((att: any) => 
                att._id === id || att._id?.toString() === id?.toString()
              )
              if (attendee && attendee.email) {
                attendeeEmail = attendee.email
                console.log(`Found attendee email from API:`, attendeeEmail)
              } else {
                // Try JSON file (employees)
                const employee = employees.find((emp: any) => 
                  emp._id === id || emp._id?.toString() === id?.toString()
                )
                if (employee && employee.email) {
                  attendeeEmail = employee.email
                  console.log(`Found employee email from JSON:`, attendeeEmail)
                } else {
                  console.warn(`Could not find attendee/employee with _id:`, id)
                }
              }
            }
          }
          
          if (attendeeEmail && !emailAddresses.includes(attendeeEmail)) {
            emailAddresses.push(attendeeEmail)
            attendeeEmails.push(attendeeEmail)
          }
        })
      } else {
        console.warn("No attendeeIds array in schedule or it's not an array")
      }
      
      console.log("Final email addresses:", emailAddresses)
      
      // Add other attendees emails (comma-separated)
      if (schedule.otherAttendees) {
        const otherEmails = schedule.otherAttendees
          .split(',')
          .map((email: string) => email.trim())
          .filter((email: string) => email && email.includes('@') && !emailAddresses.includes(email))
        emailAddresses.push(...otherEmails)
        otherAttendees.push(...otherEmails)
      }
      
      return {
        emailAddresses,
        clientEmail,
        attendeeEmails,
        otherAttendees,
      }
    }
    
    // Function to show recipients preview
    const handleShowRecipients = async (schedule: any) => {
      try {
        const recipients = extractRecipients(schedule)
        
        if (recipients.emailAddresses.length === 0) {
          toast({
            title: 'No Email Addresses',
            description: 'No email addresses found for this meeting.',
            variant: 'destructive',
          })
          return
        }
        
        setRecipientsData({
          clientEmail: recipients.clientEmail || undefined,
          attendeeEmails: recipients.attendeeEmails.length > 0 ? recipients.attendeeEmails : undefined,
          otherAttendees: recipients.otherAttendees.length > 0 ? recipients.otherAttendees : undefined,
        })
        setRecipientsPreviewOpen(true)
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Failed to extract recipients. Please try again.',
          variant: 'destructive',
        })
      }
    }

  const handleSendEmail = async (schedule: any) => {
    try {
      const recipients = extractRecipients(schedule)
      const { emailAddresses, clientEmail, attendeeEmails } = recipients
      
      if (emailAddresses.length === 0) {
        toast({
          title: 'No Email Addresses',
          description: 'No email addresses found for this meeting.',
          variant: 'destructive',
        })
        return
      }
      
      // Format meeting details for email body
      const formatDate = (dateString: string) => {
        try {
          const date = new Date(dateString)
          return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        } catch {
          return dateString
        }
      }
      
      let emailBody = `Meeting: ${schedule.title}\n\n`
      emailBody += `Date: ${formatDate(schedule.startDate)}`
      if (schedule.startDate !== schedule.endDate) {
        emailBody += ` - ${formatDate(schedule.endDate)}`
      }
      emailBody += `\nTime: ${schedule.startTime} - ${schedule.endTime}\n`
      emailBody += `Location: ${schedule.location || 'TBD'}\n\n`
      
      if (schedule.agenda) {
        emailBody += `Agenda:\n${schedule.agenda}\n\n`
      }
      
      if (schedule.meetingPoints && schedule.meetingPoints.length > 0) {
        emailBody += `Meeting Points:\n`
        schedule.meetingPoints.forEach((point: any, index: number) => {
          emailBody += `\n${index + 1}. ${point.pointsDiscussed || 'N/A'}\n`
          if (point.planOfAction) {
            emailBody += `   Plan of Action: ${point.planOfAction}\n`
          }
          if (point.accountability) {
            const accountability = point.accountability === 'admin' 
              ? 'Admin' 
              : (typeof point.accountability === 'string' && point.accountability.startsWith('client:')) 
                ? 'Client' 
                : point.accountability
            emailBody += `   Accountability: ${accountability}\n`
          }
        })
      }
      
      // First, get email preview (HTML) from API
      try {
        const previewResponse = await fetch(`/api/schedules/${schedule._id}/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: emailAddresses,
            subject: `Meeting Invitation: ${schedule.title}`,
            schedule: schedule,
          }),
        })

        if (!previewResponse.ok) {
          const errorData = await previewResponse.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to generate email preview')
        }

        const previewResult = await previewResponse.json()
        
        // Get HTML from result
        let emailHTML = ''
        if (previewResult.emailContent?.html) {
          emailHTML = previewResult.emailContent.html
        } else if (previewResult.html) {
          emailHTML = previewResult.html
        } else {
          throw new Error('No HTML content in preview response')
        }

        // Show preview dialog
        setEmailPreviewData({
          schedule,
          emailAddresses,
          html: emailHTML,
          subject: previewResult.emailContent?.subject || `Meeting Invitation: ${schedule.title}`,
          clientEmail: clientEmail || undefined,
          attendeeEmails: attendeeEmails.length > 0 ? attendeeEmails : undefined,
        })
        setEmailPreviewOpen(true)
      } catch (apiError: any) {
        console.error('Email preview API error:', apiError)
        toast({
          title: 'Error',
          description: 'Failed to generate email preview. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to open email client. Please try again.',
        variant: 'destructive',
      })
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const getPointsCount = (schedule: any) => {
    const meetingPoints = (schedule as any).meetingPoints || []
    const total = meetingPoints.length
    const completed = meetingPoints.filter((point: any) => point.status === 'complete').length
    return { completed, total }
  }

  // Function to handle opening meeting points modal
  const handleOpenMeetingPoints = (schedule: any) => {
    setSelectedScheduleForPoints(schedule)
    setMeetingPointsModalOpen(true)
  }

  // Function to mark a meeting point as complete
  const handleMarkPointComplete = async (pointIndex: number) => {
    if (!selectedScheduleForPoints?._id) return

    const meetingPoints = [...((selectedScheduleForPoints as any).meetingPoints || [])]
    meetingPoints[pointIndex] = {
      ...meetingPoints[pointIndex],
      status: 'complete'
    }

    try {
      await updateSchedule({
        scheduleId: selectedScheduleForPoints._id,
        data: { meetingPoints }
      }).unwrap()
      
      // Update local state
      setSelectedScheduleForPoints({
        ...selectedScheduleForPoints,
        meetingPoints
      })
      
      // Refetch schedules to update the table
      refetch()
      
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

  // Function to actually send the email after preview
  const handleConfirmSendEmail = async () => {
    if (!emailPreviewData) return

    setIsSendingEmail(true)
    try {
      const response = await fetch(`/api/schedules/${emailPreviewData.schedule._id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailPreviewData.emailAddresses,
          subject: emailPreviewData.subject,
          schedule: emailPreviewData.schedule,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to send email')
      }

      const result = await response.json()
      
      // Check if email was actually sent or just content generated
      if (result.messageId) {
        toast({
          title: 'Email Sent',
          description: `Meeting invitation sent successfully to ${emailPreviewData.emailAddresses.length} recipient(s).`,
        })
        setEmailPreviewOpen(false)
        setEmailPreviewData(null)
        return
      } else if (result.emailContent) {
        // SMTP not configured, use mailto fallback
        console.log('SMTP not configured, using mailto fallback')
        const subject = encodeURIComponent(result.emailContent.subject)
        const body = encodeURIComponent(
          `Meeting: ${emailPreviewData.schedule.title}\n\n` +
          `Date: ${new Date(emailPreviewData.schedule.startDate).toLocaleDateString()}\n` +
          `Time: ${emailPreviewData.schedule.startTime} - ${emailPreviewData.schedule.endTime}\n` +
          `Location: ${emailPreviewData.schedule.location || 'TBD'}\n\n` +
          (emailPreviewData.schedule.agenda ? `Agenda:\n${emailPreviewData.schedule.agenda}\n\n` : '')
        )
        const to = emailPreviewData.emailAddresses.join(',')
        const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`
        window.location.href = mailtoLink
        
        toast({
          title: 'Opening Email Client',
          description: 'Email service not configured. Opening your email client to send manually.',
        })
        setEmailPreviewOpen(false)
        setEmailPreviewData(null)
        return
      } else {
        toast({
          title: 'Email Sent',
          description: result.message || `Meeting invitation sent to ${emailPreviewData.emailAddresses.length} recipient(s).`,
        })
        setEmailPreviewOpen(false)
        setEmailPreviewData(null)
        return
      }
    } catch (apiError: any) {
      console.error('Email send error:', apiError)
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSendingEmail(false)
    }
    
     
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {/* <Badge variant="secondary" className="ml-auto">
          {filteredSchedules.length} 
           meeting{filteredSchedules.length !== 1 ? 's' : ''}
        </Badge> */}
      </div>

      {/* Schedules Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead className="w-[100px]">Points</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {searchTerm ? 'No upcoming meetings found matching your search.' : 'No upcoming meetings found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule) => {
                const { completed, total } = getPointsCount(schedule)
                return (
                <TableRow key={schedule._id}>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <p className="font-medium"><Link href={`/schedule/${schedule._id}`}>{schedule.title}</Link></p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {schedule.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(schedule.startDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{schedule.startTime} - {schedule.endTime}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleOpenMeetingPoints(schedule)}
                      className="text-sm font-medium hover:text-primary cursor-pointer transition-colors"
                      title="Click to view and update meeting points"
                    >
                      {total > 0 ? `${completed}/${total}` : '0/0'}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleSendEmail(schedule)}
                        title="Preview and send email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleShowRecipients(schedule)}
                        title="View recipients"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {/* <DropdownMenuItem onClick={() => handleView(schedule)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStart(schedule)}>
                            <Clock className="mr-2 h-4 w-4" />
                            Start Meeting
                          </DropdownMenuItem> */}
                          <DropdownMenuItem onClick={() => onEdit(schedule)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Schedule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirmOpen(schedule._id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Schedule
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredSchedules.length} of {schedules.length} meetings
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (() => {
        const scheduleToDelete = schedules.find((s: any) => s._id === deleteConfirmOpen)
        return (
          <AlertDialog open={!!deleteConfirmOpen} onOpenChange={(open) => !open && setDeleteConfirmOpen(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Schedule?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{scheduleToDelete?.title || 'this schedule'}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => scheduleToDelete && handleDelete(scheduleToDelete)}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      })()}

      {/* Email Preview Dialog */}
      <Dialog open={emailPreviewOpen} onOpenChange={setEmailPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview the meeting invitation email before sending to {emailPreviewData?.emailAddresses.length || 0} recipient(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50">
            {emailPreviewData?.html ? (
              <div 
                dangerouslySetInnerHTML={{ __html: emailPreviewData.html }}
                className="bg-white p-6 rounded shadow-sm"
                style={{ maxWidth: '600px', margin: '0 auto' }}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Loading email preview...
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setEmailPreviewOpen(false)
                setEmailPreviewData(null)
              }}
              disabled={isSendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSendEmail}
              disabled={isSendingEmail}
            >
              {isSendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipients Preview Dialog */}
      <Dialog open={recipientsPreviewOpen} onOpenChange={setRecipientsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Recipients</DialogTitle>
            <DialogDescription>
              View the list of recipients who will receive the meeting invitation email
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {recipientsData?.clientEmail && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Client:</h4>
                <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">{recipientsData.clientEmail}</p>
                </div>
              </div>
            )}
            
            {recipientsData?.attendeeEmails && recipientsData.attendeeEmails.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Attendees ({recipientsData.attendeeEmails.length}):
                </h4>
                <div className="space-y-2">
                  {recipientsData.attendeeEmails.map((email, index) => (
                    <div key={index} className="bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-900">{email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {recipientsData?.otherAttendees && recipientsData.otherAttendees.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Other Attendees ({recipientsData.otherAttendees.length}):
                </h4>
                <div className="space-y-2">
                  {recipientsData.otherAttendees.map((email, index) => (
                    <div key={index} className="bg-purple-50 px-4 py-3 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-900">{email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(!recipientsData?.clientEmail && 
              (!recipientsData?.attendeeEmails || recipientsData.attendeeEmails.length === 0) &&
              (!recipientsData?.otherAttendees || recipientsData.otherAttendees.length === 0)) && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recipients found for this meeting.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRecipientsPreviewOpen(false)
                setRecipientsData(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Points Modal */}
      <Dialog open={meetingPointsModalOpen} onOpenChange={setMeetingPointsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Meeting Points</DialogTitle>
            <DialogDescription>
              {selectedScheduleForPoints?.title} - View and update meeting points status
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {selectedScheduleForPoints?.meetingPoints && selectedScheduleForPoints.meetingPoints.length > 0 ? (
              <div className="space-y-4">
                {selectedScheduleForPoints.meetingPoints.map((point: any, index: number) => {
                  const isComplete = point.status === 'complete'
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">
                              {index + 1}.
                            </span>
                            <h4 className="text-base font-semibold">
                              {point.pointsDiscussed || 'N/A'}
                            </h4>
                            {isComplete && (
                              <Badge variant="default" className="bg-green-600">
                                Complete
                              </Badge>
                            )}
                          </div>
                          
                          {point.planOfAction && (
                            <div className="pl-6">
                              <p className="text-sm text-muted-foreground">
                                <strong>Plan of Action:</strong> {point.planOfAction}
                              </p>
                            </div>
                          )}
                          
                          {point.accountability && (
                            <div className="pl-6">
                              <p className="text-sm text-muted-foreground">
                                <strong>Accountability:</strong>{' '}
                                {point.accountability === 'admin'
                                  ? 'Admin'
                                  : point.accountability.startsWith('client:')
                                  ? 'Client'
                                  : point.accountability}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {!isComplete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkPointComplete(index)}
                            disabled={isUpdatingPoints}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            title="Mark as complete"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                           
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No meeting points added for this schedule.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMeetingPointsModalOpen(false)
                setSelectedScheduleForPoints(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}





