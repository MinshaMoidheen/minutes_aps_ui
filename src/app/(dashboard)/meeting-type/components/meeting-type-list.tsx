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
import { MoreHorizontal, Search, Edit, Trash2 } from 'lucide-react'
import { MeetingType } from '@/store/api/meetingTypeApi'
import { toast } from '@/hooks/use-toast'
import { useGetMeetingTypesQuery, useDeleteMeetingTypeMutation } from '@/store/api/meetingTypeApi'
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

interface MeetingTypeListProps {
  onEdit: (meetingType: MeetingType) => void
}

export function MeetingTypeList({ onEdit }: MeetingTypeListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Fetch meeting types from API
  const { data, isLoading, error } = useGetMeetingTypesQuery({ limit: 20, offset: 0 })
  const [deleteMeetingType, { isLoading: isDeleting }] = useDeleteMeetingTypeMutation()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null)
  
  const meetingTypes = data?.data?.meetingTypes || []

  // Filter meeting types based on search term
  const filteredMeetingTypes = useMemo(() => {
    if (!searchTerm) return meetingTypes

    const term = searchTerm.toLowerCase()
    return meetingTypes.filter(
      (meetingType) =>
        meetingType.title.toLowerCase().includes(term) ||
        (meetingType.description && meetingType.description.toLowerCase().includes(term))
    )
  }, [meetingTypes, searchTerm])

  const handleDelete = async (meetingTypeId: string) => {
    try {
      await deleteMeetingType(meetingTypeId).unwrap()
      const deleted = filteredMeetingTypes.find((m) => m._id === meetingTypeId)
      toast({
        title: 'Meeting Type Deleted',
        description: `${deleted?.title || 'Meeting Type'} has been deleted successfully.`,
      })
      setDeleteConfirmOpen(null)
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error?.data?.message || 'Failed to delete meeting type.',
        variant: 'destructive',
      })
    }
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
        <p className="text-muted-foreground">Loading meeting types...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load meeting types. Please try again.</p>
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
            placeholder="Search meeting types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="secondary" className="ml-auto">
          {filteredMeetingTypes.length} type{filteredMeetingTypes.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Meeting Types Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMeetingTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchTerm ? 'No meeting types found matching your search.' : 'No meeting types found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMeetingTypes.map((meetingType) => (
                <TableRow key={meetingType._id}>
                  <TableCell className="font-medium">
                    {meetingType.title}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate text-muted-foreground">
                      {meetingType.description || 'No description'}
                    </p>
                  </TableCell>
                  <TableCell>{formatDate(meetingType.createdAt)}</TableCell>
                  <TableCell>{formatDate(meetingType.updatedAt)}</TableCell>
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
                       
                        <DropdownMenuItem onClick={() => onEdit(meetingType)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Meeting Type
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirmOpen(meetingType._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Meeting Type
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
          Showing {filteredMeetingTypes.length} of {meetingTypes.length} meeting types
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
        const mtToDelete = filteredMeetingTypes.find((m) => m._id === deleteConfirmOpen)
        return (
          <AlertDialog open={!!deleteConfirmOpen} onOpenChange={(open) => !open && setDeleteConfirmOpen(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Meeting Type?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{mtToDelete?.title || 'this meeting type'}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => mtToDelete && handleDelete(mtToDelete._id)}
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

