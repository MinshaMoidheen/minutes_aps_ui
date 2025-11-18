'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Main } from '@/components/ui/main'
import { ClientList } from './components/client-list'
import { ClientForm } from './components/client-form'
import { RoleProtectedRoute } from '@/components/role-protected-route'

// Import Client interface from API
export interface Client {
  _id: string
  username: string
  email: string
  phoneNumber: string
  refAdmin: string
  company?: string
  address?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const topNav = [
  {
    title: 'Client Management',
    href: 'client-management',
    isActive: true,
    disabled: false,
  },
]

export default function ClientManagementPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined)

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setActiveTab('edit')
  }

  const handleSuccess = () => {
    setEditingClient(undefined)
    setActiveTab('list')
  }

  const handleCancel = () => {
    setEditingClient(undefined)
    setActiveTab('list')
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
              <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-3">
                <TabsTrigger value="list" className="text-xs sm:text-sm">Client List</TabsTrigger>
                <TabsTrigger value="create" className="text-xs sm:text-sm">Create Client</TabsTrigger>
                {editingClient && <TabsTrigger value="edit" className="text-xs sm:text-sm">Edit Client</TabsTrigger>}
              </TabsList>
            </Tabs>
            {activeTab === 'list' && (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  size="sm"
                >
                  Add New Client
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {activeTab === 'list' && (
              <Card>
                {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <ClientList onEdit={handleEdit} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'create' && (
              <Card>
                 {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <ClientForm 
                    mode="create" 
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'edit' && editingClient && (
              <Card>
                {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <ClientForm 
                    mode="edit" 
                    client={editingClient}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Main>
    </RoleProtectedRoute>
  )
}
