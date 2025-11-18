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
import { MoreHorizontal, Search, Edit, Trash2, Eye, Calendar, Clock, MapPin, FileText } from 'lucide-react'
import { Schedule } from '../page'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useDeleteScheduleMutation } from '@/store/api/scheduleApi'
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

// Mock data for previous meetings (past dates)
const mockPreviousSchedules: Schedule[] = [
  {
    _id: '1',
    title: 'Client Meeting - Project Discussion',
    description: 'Discuss project requirements and timeline with the client team',
    startDate: '2024-11-15',
    endDate: '2024-11-15',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Conference Room A',
    clientId: 'client1',
    client: {
      _id: 'client1',
      username: 'john_doe',
      email: 'john.doe@example.com',
    },
    attendeeIds: ['attendee1', 'attendee2'],
    attendees: [
      {
        _id: 'attendee1',
        username: 'alex_johnson',
        email: 'alex.johnson@company.com',
      },
      {
        _id: 'attendee2',
        username: 'sarah_wilson',
        email: 'sarah.wilson@business.org',
      },
    ],
    otherAttendees: 'External consultant: Mike Smith',
    organizer: 'John Doe',
    status: 'completed',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
  },
  {
    _id: '2',
    title: 'Team Standup Meeting',
    description: 'Daily standup meeting with development team',
    startDate: '2024-11-14',
    endDate: '2024-11-14',
    startTime: '09:00',
    endTime: '09:30',
    location: 'Office - Main Floor',
    clientId: 'client2',
    client: {
      _id: 'client2',
      username: 'jane_smith',
      email: 'jane.smith@company.com',
    },
    attendeeIds: ['attendee3', 'attendee4'],
    attendees: [
      {
        _id: 'attendee3',
        username: 'mike_chen',
        email: 'mike.chen@corp.net',
      },
      {
        _id: 'attendee4',
        username: 'lisa_garcia',
        email: 'lisa.garcia@enterprise.com',
      },
    ],
    otherAttendees: '',
    organizer: 'Jane Smith',
    status: 'completed',
    createdAt: '2024-02-02T10:15:00Z',
    updatedAt: '2024-02-02T10:15:00Z',
  },
  {
    _id: '3',
    title: 'Product Demo Session',
    description: 'Demonstrate new features to stakeholders',
    startDate: '2024-11-10',
    endDate: '2024-11-10',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Presentation Room',
    clientId: 'client3',
    client: {
      _id: 'client3',
      username: 'bob_wilson',
      email: 'bob.wilson@business.org',
    },
    attendeeIds: ['attendee5', 'attendee6'],
    attendees: [
      {
        _id: 'attendee5',
        username: 'david_kim',
        email: 'david.kim@startup.io',
      },
      {
        _id: 'attendee6',
        username: 'emma_taylor',
        email: 'emma.taylor@agency.co',
      },
    ],
    otherAttendees: 'Stakeholder: Robert Johnson',
    organizer: 'Bob Wilson',
    status: 'completed',
    createdAt: '2024-02-03T11:30:00Z',
    updatedAt: '2024-02-03T11:30:00Z',
  },
]

interface PreviousScheduleListProps {
  onEdit: (schedule: Schedule) => void
}

export function PreviousScheduleList({ onEdit }: PreviousScheduleListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [schedules] = useState<Schedule[]>(mockPreviousSchedules)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null)
  const [deleteSchedule, { isLoading: isDeleting }] = useDeleteScheduleMutation()

  // Filter schedules based on search term
  const filteredSchedules = useMemo(() => {
    if (!searchTerm) return schedules

    const term = searchTerm.toLowerCase()
    return schedules.filter(
      (schedule) =>
        schedule.title.toLowerCase().includes(term) ||
        schedule.description.toLowerCase().includes(term) ||
        schedule.location.toLowerCase().includes(term) ||
        schedule.client?.username.toLowerCase().includes(term) ||
        schedule.client?.email.toLowerCase().includes(term)
    )
  }, [schedules, searchTerm])

  const handleDelete = async (schedule: Schedule) => {
    try {
      await deleteSchedule((schedule as any)._id).unwrap()
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

  const handleView = (schedule: Schedule) => {
    // Mock view functionality
    toast({
      title: 'View Schedule',
      description: `Viewing details for ${schedule.title}`,
    })
  }

  const handleReschedule = (schedule: Schedule) => {
    // Mock reschedule functionality
    toast({
      title: 'Reschedule Meeting',
      description: `Rescheduling ${schedule.title} for a future date.`,
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: 'secondary' as const, label: 'Scheduled' },
      'in-progress': { variant: 'default' as const, label: 'In Progress' },
      completed: { variant: 'outline' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
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

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search previous meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="outline" className="ml-auto">
          {filteredSchedules.length} previous meeting{filteredSchedules.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Schedules Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Attendees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Meeting Points</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {searchTerm ? 'No previous meetings found matching your search.' : 'No previous meetings found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule) => (
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
                        <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span>{schedule.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {schedule.client?.username?.charAt(0).toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{schedule.client?.username || 'Unknown Client'}</p>
                        <p className="text-xs text-muted-foreground">{schedule.client?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-1">
                      {schedule.attendees?.slice(0, 3).map((attendee, index) => (
                        <div
                          key={attendee._id}
                          className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background"
                          style={{ zIndex: 3 - index }}
                        >
                          <span className="text-xs font-medium text-primary">
                            {attendee.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      ))}
                      {schedule.attendees && schedule.attendees.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border-2 border-background text-xs">
                          +{schedule.attendees.length - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(schedule.status)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/schedule/meeting-points')}
                      className="flex items-center space-x-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Points</span>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        
                        <DropdownMenuItem onClick={() => handleReschedule(schedule)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(schedule)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Schedule
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirmOpen((schedule as any)._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Schedule
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredSchedules.length} of {schedules.length} previous meetings
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
    </div>
  )
}
