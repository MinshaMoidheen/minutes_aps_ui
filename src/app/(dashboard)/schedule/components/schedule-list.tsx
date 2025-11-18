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
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

// Mock data for design purposes
const mockSchedules: Schedule[] = [
  {
    _id: '1',
    title: 'Client Meeting - Project Discussion',
    description: 'Discuss project requirements and timeline with the client team',
    startDate: '2024-02-15',
    endDate: '2024-02-15',
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
    status: 'scheduled',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
  },
  {
    _id: '2',
    title: 'Team Standup Meeting',
    description: 'Daily standup meeting with development team',
    startDate: '2024-02-16',
    endDate: '2024-02-16',
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
    status: 'in-progress',
    createdAt: '2024-02-02T10:15:00Z',
    updatedAt: '2024-02-02T10:15:00Z',
  },
  {
    _id: '3',
    title: 'Product Demo Session',
    description: 'Demonstrate new features to stakeholders',
    startDate: '2024-02-18',
    endDate: '2024-02-18',
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
    status: 'scheduled',
    createdAt: '2024-02-03T11:30:00Z',
    updatedAt: '2024-02-03T11:30:00Z',
  },
  {
    _id: '4',
    title: 'Training Workshop',
    description: 'Technical training session for new team members',
    startDate: '2024-02-20',
    endDate: '2024-02-20',
    startTime: '13:00',
    endTime: '17:00',
    location: 'Training Center',
    clientId: 'client1',
    client: {
      _id: 'client1',
      username: 'john_doe',
      email: 'john.doe@example.com',
    },
    attendeeIds: ['attendee1', 'attendee3'],
    attendees: [
      {
        _id: 'attendee1',
        username: 'alex_johnson',
        email: 'alex.johnson@company.com',
      },
      {
        _id: 'attendee3',
        username: 'mike_chen',
        email: 'mike.chen@corp.net',
      },
    ],
    otherAttendees: 'External trainer: Sarah Johnson',
    organizer: 'Alex Johnson',
    status: 'completed',
    createdAt: '2024-02-04T08:45:00Z',
    updatedAt: '2024-02-05T16:20:00Z',
  },
]

interface ScheduleListProps {
  onEdit: (schedule: Schedule) => void
}

export function ScheduleList({ onEdit }: ScheduleListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [schedules] = useState<Schedule[]>(mockSchedules)

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

  const handleDelete = (schedule: Schedule) => {
    // Mock delete functionality
    toast({
      title: 'Schedule Deleted',
      description: `${schedule.title} has been deleted successfully.`,
    })
  }

  const handleView = (schedule: Schedule) => {
    // Mock view functionality
    toast({
      title: 'View Schedule',
      description: `Viewing details for ${schedule.title}`,
    })
  }

  const handleStart = (schedule: Schedule) => {
    // Mock start functionality
    toast({
      title: 'Schedule Started',
      description: `${schedule.title} has been started.`,
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
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="secondary" className="ml-auto">
          {filteredSchedules.length} schedule{filteredSchedules.length !== 1 ? 's' : ''}
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
                  {searchTerm ? 'No schedules found matching your search.' : 'No schedules found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule) => (
                <TableRow key={schedule._id}>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <p className="font-medium">{schedule.title}</p>
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
                      
                        {schedule.status === 'scheduled' && (
                          <DropdownMenuItem onClick={() => handleStart(schedule)}>
                            <Clock className="mr-2 h-4 w-4" />
                            Start Meeting
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(schedule)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Schedule
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(schedule)}
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
          Showing {filteredSchedules.length} of {schedules.length} schedules
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
    </div>
  )
}

