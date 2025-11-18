'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Main } from '@/components/ui/main'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Meeting Point interface
interface MeetingPoint {
  id: string
  pointsDiscussed: string
  planOfAction: string
  accountability: string
}

const topNav = [
  {
    title: 'Meeting Points',
    href: 'schedule/meeting-points',
    isActive: true,
    disabled: false,
  },
]

export default function MeetingPointsPage() {
  const router = useRouter()
  const [points, setPoints] = useState<MeetingPoint[]>([
    {
      id: '1',
      pointsDiscussed: '',
      planOfAction: '',
      accountability: '',
    }
  ])

  const addNewPoint = () => {
    const newPoint: MeetingPoint = {
      id: Date.now().toString(),
      pointsDiscussed: '',
      planOfAction: '',
      accountability: '',
    }
    setPoints([...points, newPoint])
  }

  const removePoint = (id: string) => {
    if (points.length > 1) {
      setPoints(points.filter(point => point.id !== id))
    }
  }

  const updatePoint = (id: string, field: keyof MeetingPoint, value: string) => {
    setPoints(points.map(point => 
      point.id === id ? { ...point, [field]: value } : point
    ))
  }

  const handleSave = () => {
    // Here you would typically save the data to your API
    console.log('Saving meeting points:', points)
    // Show success message or redirect
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
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleSave}
                className="w-full sm:w-auto"
              >
                Save All Points
              </Button>
            </div>
          </div>

          <Card>
          
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {/* Table Headers - Hidden on mobile, shown on desktop */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-muted/50 rounded-lg font-medium text-sm">
                  <div className="col-span-4">Points Discussed</div>
                  <div className="col-span-4">Plan of Action</div>
                  <div className="col-span-3">Accountability</div>
                  <div className="col-span-1">Actions</div>
                </div>

                {/* Desktop Table Rows */}
                <div className="hidden md:block space-y-4">
                  {points.map((point, index) => (
                    <div key={point.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                      <div className="col-span-4">
                        <Textarea
                          placeholder="Enter the points discussed in the meeting..."
                          value={point.pointsDiscussed}
                          onChange={(e) => updatePoint(point.id, 'pointsDiscussed', e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="col-span-4">
                        <Textarea
                          placeholder="Enter the plan of action for this point..."
                          value={point.planOfAction}
                          onChange={(e) => updatePoint(point.id, 'planOfAction', e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Who is accountable?"
                          value={point.accountability}
                          onChange={(e) => updatePoint(point.id, 'accountability', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePoint(point.id)}
                          disabled={points.length === 1}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-4">
                  {points.map((point, index) => (
                    <Card key={point.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">Point #{index + 1}</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removePoint(point.id)}
                            disabled={points.length === 1}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Points Discussed</label>
                            <Textarea
                              placeholder="Enter the points discussed in the meeting..."
                              value={point.pointsDiscussed}
                              onChange={(e) => updatePoint(point.id, 'pointsDiscussed', e.target.value)}
                              className="min-h-[80px] mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Plan of Action</label>
                            <Textarea
                              placeholder="Enter the plan of action for this point..."
                              value={point.planOfAction}
                              onChange={(e) => updatePoint(point.id, 'planOfAction', e.target.value)}
                              className="min-h-[80px] mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Accountability</label>
                            <Input
                              placeholder="Who is accountable?"
                              value={point.accountability}
                              onChange={(e) => updatePoint(point.id, 'accountability', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Add Point Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={addNewPoint}
                    variant="outline"
                    className="flex items-center space-x-2 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Point</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </RoleProtectedRoute>
  )
}
