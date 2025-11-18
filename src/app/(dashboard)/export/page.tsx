'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  Calendar, 
  FileSpreadsheet, 
  AlertCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Main } from '@/components/ui/main'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { useLazyExportDataQuery } from '@/store/api/importExportApi'
import { useGetMeetingTypesQuery } from '@/store/api/meetingTypeApi'
import { useGetClientsQuery } from '@/store/api/clientApi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const topNav = [
  {
    title: 'Export Management',
    href: 'export',
    isActive: true,
    disabled: false,
  },
]

export default function ExportPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [triggerExport, { isFetching }] = useLazyExportDataQuery()
  const [meetingTypeId, setMeetingTypeId] = useState('all')
  const [clientId, setClientId] = useState('all')

  const { data: meetingTypesData } = useGetMeetingTypesQuery({ limit: 200, offset: 0 })
  const { data: clientsData } = useGetClientsQuery({ limit: 200, offset: 0 })

  const handleExport = async () => {
    setIsExporting(true)

    try {
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        toast({
          title: 'Invalid Date Range',
          description: 'Start date must be before or equal to end date',
          variant: 'destructive',
        })
        setIsExporting(false)
        return
      }

      const params: any = {}
      if (startDate) params.startDate = new Date(startDate).toISOString()
      if (endDate) params.endDate = new Date(endDate).toISOString()
      if (meetingTypeId && meetingTypeId !== 'all') params.meetingTypeId = meetingTypeId
      if (clientId && clientId !== 'all') params.clientId = clientId

      const res = await triggerExport(params).unwrap()
      const urlObj = window.URL.createObjectURL(res.blob)
      const a = document.createElement('a')
      a.href = urlObj
      a.download = res.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(urlObj)
      toast({ title: 'Export Successful', description: `${res.filename} has been downloaded successfully` })

    } catch (error) {
      toast({
        title: 'Export Failed',
        description: `Failed to export data. Please try again.`,
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const generateMockData = (type: string, startDate: string, endDate: string) => {
    const data = {
      schedules: `title,description,startDate,endDate,startTime,endTime,location,clientId,organizer,status
Team Meeting,Weekly team standup,${startDate},${startDate},09:00,10:00,Conference Room A,client1,John Doe,scheduled
Client Call,Project discussion,${endDate},${endDate},14:00,15:30,Online,client2,Jane Smith,scheduled
Planning Session,Quarterly planning,${startDate},${endDate},10:00,12:00,Board Room,client3,Bob Wilson,in-progress`,
      
      attendees: `username,email,firstName,lastName,phone,company,department,role
john.doe@example.com,john.doe@example.com,John,Doe,+1234567890,Acme Corp,IT,Developer
jane.smith@example.com,jane.smith@example.com,Jane,Smith,+1234567891,Tech Inc,Marketing,Manager
bob.wilson@example.com,bob.wilson@example.com,Bob,Wilson,+1234567892,Startup Co,Engineering,Lead`,
      
      meetings: `title,description,startDate,endDate,startTime,endTime,location,clientId,organizer,otherAttendees,status
Team Meeting,Weekly team standup,${startDate},${startDate},09:00,10:00,Conference Room A,client1,John Doe,External: Mike Smith,scheduled
Client Call,Project discussion,${endDate},${endDate},14:00,15:30,Online,client2,Jane Smith,,scheduled
Planning Session,Quarterly planning,${startDate},${endDate},10:00,12:00,Board Room,client3,Bob Wilson,Stakeholder: Alice Johnson,in-progress`
    }
    
    return data[type as keyof typeof data] || ''
  }

  const downloadFile = (content: string, filename: string, format: string) => {
    let mimeType = 'text/csv'
    let fileContent = content

    if (format === 'excel') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      // For demo purposes, we'll still use CSV but with .xlsx extension
      filename = filename.replace('.excel', '.xlsx')
    } else if (format === 'pdf') {
      mimeType = 'application/pdf'
      filename = filename.replace('.pdf', '.pdf')
      // For demo purposes, we'll create a simple text-based PDF content
      fileContent = `PDF Export\n\n${content.replace(/,/g, ' | ')}`
    }

    const blob = new Blob([fileContent], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <Header fixed>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className="p-4 md:p-6 w-full">
          {/* Export Form */}
          <Card>
            <br/>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-6">
                {/* Date Range Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isExporting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isExporting}
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meeting Type</Label>
                    <Select value={meetingTypeId} onValueChange={setMeetingTypeId} disabled={isExporting}>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {meetingTypesData?.data?.meetingTypes?.map((mt: any) => (
                          <SelectItem key={mt._id} value={mt._id}>
                            {mt.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select value={clientId} onValueChange={setClientId} disabled={isExporting}>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {clientsData?.data?.clients?.map((c: any) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.username} ({c.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Export Button */}
                <Button
                  onClick={handleExport}
                  disabled={isExporting || isFetching}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting || isFetching ? 'Exporting...' : 'Export Meetings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </RoleProtectedRoute>
  )
}
