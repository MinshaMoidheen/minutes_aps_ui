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
import type { Schedule } from '@/store/api/scheduleApi'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useGetSchedulesQuery, useDeleteScheduleMutation } from '@/store/api/scheduleApi'
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
  
  const { data, isLoading, error } = useGetSchedulesQuery({ limit: 20, offset: 0, status: status })
  const [deleteSchedule, { isLoading: isDeleting }] = useDeleteScheduleMutation()
  const schedules: any[] = data?.schedules || []

  console.log("schedules",data)

  // Filter schedules based on search term
  const filteredSchedules = useMemo(() => {
    if (!searchTerm) return schedules

    const term = searchTerm.toLowerCase()
    return schedules.filter((schedule: any) => {
      const title = (schedule.title || '').toLowerCase()
      const agenda = (schedule.agenda || '').toLowerCase()
      const location = (schedule.location || '').toLowerCase()
      const clientUser = (schedule.client?.username || '').toLowerCase()
      const clientEmail = (schedule.client?.email || '').toLowerCase()
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
                    <div className="text-sm font-medium">
                      {total > 0 ? `${completed}/${total}` : '0/0'}
                    </div>
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

      {/* Schedule Detail Modal */}
      <ScheduleDetailModal
        schedule={selectedSchedule as any}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedSchedule(null)
        }}
      />

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





