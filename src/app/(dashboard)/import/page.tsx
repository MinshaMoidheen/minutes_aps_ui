'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileUpload } from '@/components/ui/file-upload'
import { 
  Upload, 
  Download, 
  FileText, 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Main } from '@/components/ui/main'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { useImportDataMutation, useLazyDownloadTemplateQuery } from '@/store/api/importExportApi'

const topNav = [
  {
    title: 'Import Management',
    href: 'import',
    isActive: true,
    disabled: false,
  },
]

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState('attendees')
  const [attendeesFile, setAttendeesFile] = useState<File | null>(null)
  const [meetingsFile, setMeetingsFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    attendees: { success: number; errors: number; total: number }
    meetings: { success: number; errors: number; total: number }
  } | null>(null)

  const [importDataMutation] = useImportDataMutation()
  const [downloadTemplate] = useLazyDownloadTemplateQuery()

  const handleAttendeesFileChange = (file: File | null) => {
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
        setAttendeesFile(file)
        toast({
          title: 'File Selected',
          description: `Selected ${file.name} for attendees import`,
        })
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an Excel (.xlsx) file for attendees import',
          variant: 'destructive',
        })
      }
    } else {
      setAttendeesFile(null)
    }
  }

  const handleMeetingsFileChange = (file: File | null) => {
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
        setMeetingsFile(file)
        toast({
          title: 'File Selected',
          description: `Selected ${file.name} for meetings import`,
        })
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an Excel (.xlsx) file for meetings import',
          variant: 'destructive',
        })
      }
    } else {
      setMeetingsFile(null)
    }
  }

  const handleDownloadTemplate = async (type: 'attendees' | 'meetings') => {
    try {
      const dataType = type === 'attendees' ? 'client-attendees' : 'meets'
      const res = await downloadTemplate({ dataType }).unwrap()
      const urlObj = window.URL.createObjectURL(res.blob)
      const a = document.createElement('a')
      a.href = urlObj
      a.download = res.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(urlObj)
      toast({
        title: 'Template Downloaded',
        description: `${res.filename} has been downloaded`,
      })
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error?.data?.message || 'Failed to download template',
        variant: 'destructive',
      })
    }
  }

  const handleImport = async (type: 'attendees' | 'meetings') => {
    const file = type === 'attendees' ? attendeesFile : meetingsFile
    if (!file) {
      toast({
        title: 'No File Selected',
        description: `Please select a ${type} file to import`,
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const dataType = type === 'attendees' ? 'client-attendees' : 'meets'
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await importDataMutation({ dataType, file }).unwrap()
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      const success = result.importedCount + result.updatedCount
      const errors = result.errorCount
      const total = success + errors

      setImportResults(prev => ({
        attendees: prev?.attendees || { success: 0, errors: 0, total: 0 },
        meetings: prev?.meetings || { success: 0, errors: 0, total: 0 },
        [type]: { success, errors, total }
      }))

      if (errors > 0) {
        toast({
          title: 'Import Completed with Errors',
          description: `Imported ${success} records successfully, ${errors} errors found`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${success} ${type} records`,
        })
      }

      // Reset file input
      if (type === 'attendees') {
        setAttendeesFile(null)
      } else {
        setMeetingsFile(null)
      }

    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error?.data?.message || `Failed to import ${type} data. Please try again.`,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="sm:w-auto">
              <TabsList className="grid w-full sm:w-auto grid-cols-2">
                <TabsTrigger value="attendees" className="flex items-center space-x-2 text-xs sm:text-sm">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Import Attendees</span>
                  <span className="sm:hidden">Attendees</span>
                </TabsTrigger>
                <TabsTrigger value="meetings" className="flex items-center space-x-2 text-xs sm:text-sm">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Import Meetings</span>
                  <span className="sm:hidden">Meetings</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('attendees')}
                className="flex items-center space-x-2 w-full sm:w-auto text-xs"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Attendees Template</span>
                <span className="sm:hidden">Attendees</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('meetings')}
                className="flex items-center space-x-2 w-full sm:w-auto text-xs"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Meetings Template</span>
                <span className="sm:hidden">Meetings</span>
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Import attendees and meetings data using Excel (.xlsx) files. Download the templates above to ensure proper formatting.
              </AlertDescription>
            </Alert>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* Attendees Import */}
            <TabsContent value="attendees" className="space-y-4">
              <Card>
                <br/>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-6">
                    {/* File Upload */}
                    <FileUpload
                      onFileSelect={handleAttendeesFileChange}
                      accept={{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }}
                      maxFiles={1}
                      disabled={isUploading}
                      placeholder="Choose Excel file or drag and drop"
                      label="Select Attendees File (.xlsx)"
                      id="attendees-file"
                    />

                    {/* Upload Progress */}
                    {isUploading && activeTab === 'attendees' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                      </div>
                    )}

                    {/* Import Button */}
                    <Button
                      onClick={() => handleImport('attendees')}
                      disabled={!attendeesFile || isUploading}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Importing...' : 'Import Attendees'}
                    </Button>

                    {/* Results */}
                    {importResults?.attendees && (
                      <div className="space-y-2">
                        <Label>Import Results</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-center space-x-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-semibold">{importResults.attendees.success}</span>
                            </div>
                            <p className="text-xs text-green-600">Success</p>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center justify-center space-x-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="font-semibold">{importResults.attendees.errors}</span>
                            </div>
                            <p className="text-xs text-red-600">Errors</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center space-x-1 text-gray-600">
                              <FileText className="h-4 w-4" />
                              <span className="font-semibold">{importResults.attendees.total}</span>
                            </div>
                            <p className="text-xs text-gray-600">Total</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Meetings Import */}
            <TabsContent value="meetings" className="space-y-4">
              <Card>
                <br/>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-6">
                    {/* File Upload */}
                    <FileUpload
                      onFileSelect={handleMeetingsFileChange}
                      accept={{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }}
                      maxFiles={1}
                      disabled={isUploading}
                      placeholder="Choose Excel file or drag and drop"
                      label="Select Meetings File (.xlsx)"
                      id="meetings-file"
                    />

                    {/* Upload Progress */}
                    {isUploading && activeTab === 'meetings' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                      </div>
                    )}

                    {/* Import Button */}
                    <Button
                      onClick={() => handleImport('meetings')}
                      disabled={!meetingsFile || isUploading}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Importing...' : 'Import Meetings'}
                    </Button>

                    {/* Results */}
                    {importResults?.meetings && (
                      <div className="space-y-2">
                        <Label>Import Results</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-center space-x-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-semibold">{importResults.meetings.success}</span>
                            </div>
                            <p className="text-xs text-green-600">Success</p>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center justify-center space-x-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="font-semibold">{importResults.meetings.errors}</span>
                            </div>
                            <p className="text-xs text-red-600">Errors</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center space-x-1 text-gray-600">
                              <FileText className="h-4 w-4" />
                              <span className="font-semibold">{importResults.meetings.total}</span>
                            </div>
                            <p className="text-xs text-gray-600">Total</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </RoleProtectedRoute>
  )
}
