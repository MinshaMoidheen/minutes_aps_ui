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
import { AdminList } from './components/admin-list'
import { AdminForm } from './components/admin-form'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { useAuth } from '@/context/auth-context'


const topNav = [
  {
    title: 'Admin Management',
    href: 'admin-management',
    isActive: true,
    disabled: false,
  },
]

export default function AdminManagementPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('list')
  const [editingAdmin, setEditingAdmin] = useState<any>(null)
  
 

  const handleEdit = (admin: any) => {
    setEditingAdmin(admin)
    setActiveTab('edit')
  }

  const handleSuccess = async () => {
    setEditingAdmin(null)
    setActiveTab('list')
   
    
  }

  const handleCancel = () => {
    setEditingAdmin(null)
    setActiveTab('list')
  }

  return (
    <RoleProtectedRoute allowedRoles={['superadmin']}>
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
                <TabsTrigger value="list" className="text-xs sm:text-sm">Admin List</TabsTrigger>
                <TabsTrigger value="create" className="text-xs sm:text-sm">Create Admin</TabsTrigger>
                {editingAdmin && <TabsTrigger value="edit" className="text-xs sm:text-sm">Edit Admin</TabsTrigger>}
              </TabsList>
            </Tabs>
            {activeTab === 'list' && (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  size="sm"
                >
                  Add New Admin
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {activeTab === 'list' && (
              <Card>
                {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <AdminList onEdit={handleEdit}/>
                </CardContent>
              </Card>
            )}

            {activeTab === 'create' && (
              <Card>
                {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <AdminForm 
                    mode="create" 
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'edit' && editingAdmin && (
              <Card>
                {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <AdminForm 
                    mode="edit" 
                    admin={editingAdmin}
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
