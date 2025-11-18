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
import { UserList } from './components/user-list'
import { UserForm } from './components/user-form'
import { RoleProtectedRoute } from '@/components/role-protected-route'
import { useAuth } from '@/context/auth-context'
import { useGetUsersQuery } from '@/store/api/userApi'

const topNav = [
  {
    title: 'User Management',
    href: 'user-management',
    isActive: true,
    disabled: false,
  },
]

export default function UserManagementPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('list')
  const [editingUser, setEditingUser] = useState<any>(null)
  
  // Get refetch function from the query
  const { refetch: refetchUsers } = useGetUsersQuery({ limit: 20, offset: 0 })

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setActiveTab('edit')
  }

  const handleSuccess = async () => {
    setEditingUser(null)
    setActiveTab('list')
    // Refetch the user list to show updated data
    await refetchUsers()
  }

  const handleCancel = () => {
    setEditingUser(null)
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
                <TabsTrigger value="list" className="text-xs sm:text-sm">User List</TabsTrigger>
                <TabsTrigger value="create" className="text-xs sm:text-sm">Create User</TabsTrigger>
                {editingUser && <TabsTrigger value="edit" className="text-xs sm:text-sm">Edit User</TabsTrigger>}
              </TabsList>
            </Tabs>
            {activeTab === 'list' && (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  size="sm"
                >
                  Add New User
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {activeTab === 'list' && (
              <Card>
                {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <UserList onEdit={handleEdit} onRefetch={refetchUsers} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'create' && (
              <Card>
                 {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <UserForm 
                    mode="create" 
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'edit' && editingUser && (
              <Card>
                {/* <br/> */}
                <CardContent className="p-4 md:p-6">
                  <UserForm 
                    mode="edit" 
                    user={editingUser}
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
