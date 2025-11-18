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
import { MoreHorizontal, Search, Edit, Trash2, Eye, UserCheck } from 'lucide-react'
import { ClientAttendee } from '../page'
import { toast } from '@/hooks/use-toast'
import { 
  useGetClientAttendeesQuery,
  useDeleteClientAttendeeMutation,
} from '@/store/api/clientAttendeesApi'
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

// Fetch and render attendees from API

interface ClientAttendeesListProps {
  onEdit: (attendee: ClientAttendee) => void
}

export function ClientAttendeesList({ onEdit }: ClientAttendeesListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null)
  const { data, isLoading, error } = useGetClientAttendeesQuery({ limit: 20, offset: 0 })
  const [deleteAttendee, { isLoading: isDeleting }] = useDeleteClientAttendeeMutation()
  const attendees = (data?.data?.attendees as ClientAttendee[]) || []

  // Filter attendees based on search term
  const filteredAttendees = useMemo(() => {
    if (!searchTerm) return attendees

    const term = searchTerm.toLowerCase()
    return attendees.filter(
      (attendee) =>
        attendee.username.toLowerCase().includes(term) ||
        attendee.email.toLowerCase().includes(term) ||
        attendee.phoneNumber.toLowerCase().includes(term)
    )
  }, [attendees, searchTerm])

  const handleDelete = async (attendeeId: string) => {
    try {
      await deleteAttendee(attendeeId).unwrap()
      const attendeeToDelete = filteredAttendees.find((a) => a._id === attendeeId)
      toast({
        title: 'Attendee Deleted',
        description: `${attendeeToDelete?.username || 'Attendee'} has been deleted successfully.`,
      })
      setDeleteConfirmOpen(null)
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err?.data?.message || 'Failed to delete attendee.',
        variant: 'destructive',
      })
    }
  }

  const handleView = (attendee: ClientAttendee) => {
    // Mock view functionality
    toast({
      title: 'View Attendee',
      description: `Viewing details for ${attendee.username}`,
    })
  }

  const handleCheckIn = (attendee: ClientAttendee) => {
    // Mock check-in functionality
    toast({
      title: 'Check-in Successful',
      description: `${attendee.username} has been checked in.`,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading attendees...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load attendees. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="secondary" className="ml-auto">
          {filteredAttendees.length} attendee{filteredAttendees.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Attendees Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {searchTerm ? 'No attendees found matching your search.' : 'No attendees found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAttendees.map((attendee) => (
                <TableRow key={attendee._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {attendee.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>{attendee.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>{attendee.email}</TableCell>
                  <TableCell>{attendee.phoneNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      
                    
                        <p className="text-sm font-medium">{attendee.clientId?.username}</p>
                       
                      
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(attendee.createdAt)}</TableCell>
                  <TableCell>{formatDate(attendee.updatedAt)}</TableCell>
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
                       
                        {/* <DropdownMenuItem onClick={() => handleCheckIn(attendee)}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Check In
                        </DropdownMenuItem> */}
                        <DropdownMenuItem onClick={() => onEdit(attendee)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Attendee
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirmOpen(attendee._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Attendee
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
          Showing {filteredAttendees.length} of {attendees.length} attendees
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
        const attendeeToDelete = filteredAttendees.find((attendee) => attendee._id === deleteConfirmOpen)
        return (
          <AlertDialog open={!!deleteConfirmOpen} onOpenChange={(open) => !open && setDeleteConfirmOpen(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Attendee?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete attendee "{attendeeToDelete?.username || 'this attendee'}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => attendeeToDelete && handleDelete(attendeeToDelete._id)}
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
