'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/dashboard/overview"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { Header } from "@/components/layout/header"
import { TopNav } from "@/components/layout/top-nav"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Search } from "@/components/search"
import { ThemeSwitch } from "@/components/theme-switch"
import { Main } from '@/components/ui/main'
import { Calendar } from "@/components/ui/calendar"
import { useMemo, useState } from "react"
import { useGetSchedulesQuery } from "@/store/api/scheduleApi"
import { HeaderContainer } from "@/components/ui/header-container"
import { useAuth } from "@/context/auth-context"

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  // {
  //   title: 'Customers',
  //   href: 'dashboard/customers',
  //   isActive: false,
  //   disabled: true,
  // },
  // {
  //   title: 'Products',
  //   href: 'dashboard/products',
  //   isActive: false,
  //   disabled: true,
  // },
  // {
  //   title: 'Settings',
  //   href: 'dashboard/settings',
  //   isActive: false,
  //   disabled: true,
  // },
]

export default function DashboardPage() {
  const { user } = useAuth()

  // Selected date for filtering meetings
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  // Today ISO start boundary
  const todayIso = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }, [])

  // Meetings on selected date (00:00 - 23:59)
  const dayStartIso = useMemo(() => {
    if (!selectedDate) return undefined
    const d = new Date(selectedDate)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }, [selectedDate])
  const dayEndIso = useMemo(() => {
    if (!selectedDate) return undefined
    const d = new Date(selectedDate)
    d.setHours(23, 59, 59, 999)
    return d.toISOString()
  }, [selectedDate])

  const { data: dayMeetingsData } = useGetSchedulesQuery(
    dayStartIso && dayEndIso
      ? { limit: 200, offset: 0, startDate: dayStartIso, endDate: dayEndIso }
      : { limit: 0, offset: 0 },
  )
  const dayMeetings = dayMeetingsData?.schedules || []

  // All upcoming meetings (no 7-day limit)
  const { data: upcomingData } = useGetSchedulesQuery({ limit: 200, offset: 0, startDate: todayIso })
  const upcoming = upcomingData?.schedules || []

  // Calendar markers (all meetings fetched shallowly)
  const { data: monthMeetings } = useGetSchedulesQuery({ limit: 500, offset: 0 })
  const meetingDates = useMemo(() => {
    const set = new Set<string>()
    ;(monthMeetings?.schedules || []).forEach((s: any) => {
      const d = new Date(s.startDate)
      d.setHours(0, 0, 0, 0)
      set.add(d.toDateString())
    })
    return Array.from(set).map((ds) => new Date(ds))
  }, [monthMeetings])

  return (
    <>
      <Header fixed>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7 mb-6">
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select date to view meetings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => setSelectedDate(d ?? undefined)}
                className="w-full"
                modifiers={{ hasMeeting: meetingDates }}
                modifiersClassNames={{ hasMeeting: 'bg-primary/15 text-foreground' }}
              />
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>
                Meetings on {selectedDate ? selectedDate.toLocaleDateString() : '—'}
              </CardTitle>
              <CardDescription>Meetings scheduled for the selected date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dayMeetings.length === 0 && (
                <div className="text-sm text-muted-foreground">No meetings on this date.</div>
              )}
              {dayMeetings.map((m: any) => {
                const start = new Date(m.startDate)
                const dateStr = start.toLocaleDateString()
                return (
                  <div key={m._id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {dateStr} • {m.startTime} - {m.endTime} {m.location ? `• ${m.location}` : ''}
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-primary/10 text-primary capitalize">{m.status}</div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming list removed as requested */}

        {/* <Tabs defaultValue="overview" className="space-y-4">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
              <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
              <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+2350</div>
                  <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12,234</div>
                  <p className="text-xs text-muted-foreground">+19% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+573</div>
                  <p className="text-xs text-muted-foreground">+201 since last hour</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview />
                </CardContent>
              </Card>
              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>You made 265 sales this month.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs> */}
      </Main>
    </>
  )
}
