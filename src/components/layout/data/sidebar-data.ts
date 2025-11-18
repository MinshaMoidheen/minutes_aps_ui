import {
  IconHome,
  IconUsers,
  IconShoppingBag,
  IconPercentage,
  IconShoppingCart,
  IconTrendingUp,
  IconBuilding,
  IconSettings,
  IconHelp,
  IconPlus,
  IconBrandWhatsapp,
  IconNetwork,
  IconBook,
  IconUserCheck,
  IconUserPlus,
  IconUsersGroup,
  IconCalendarEvent,
  IconCalendar,
  IconUpload,
} from '@tabler/icons-react'
import { AudioWaveform, Command, GalleryVerticalEnd, BookOpen, CalendarDays, Clock, History, Play, Upload, Download, Settings2 } from 'lucide-react'
import { type SidebarData, type NavItem } from '../types'

export type UserRole = 'user' | 'admin' | 'superadmin'

export interface SidebarItem {
  title: string
  url: string
  icon: any
  allowedRoles?: UserRole[]
}

// Flat registry of pages with role restrictions (used to build groups)
const allSidebarItems: SidebarItem[] = [
  { title: 'Home', url: '/', icon: IconHome, allowedRoles: ['admin', 'superadmin'] },
  { title: 'Admin', url: '/admin-management', icon: IconUserCheck, allowedRoles: ['superadmin'] },
  { title: 'Users', url: '/user-management', icon: IconUserPlus, allowedRoles: ['admin', 'superadmin'] },
  { title: 'Clients', url: '/client-management', icon: IconUsersGroup, allowedRoles: ['admin', 'superadmin'] },
  { title: 'Client Attendees', url: '/client-attendees', icon: IconCalendarEvent, allowedRoles: ['admin', 'superadmin'] },
  { title: 'Meeting Types', url: '/meeting-type', icon: Settings2, allowedRoles: ['admin', 'superadmin'] },
  { title: 'All Meetings', url: '/schedule', icon: CalendarDays, allowedRoles: ['user', 'admin', 'superadmin'] },
  { title: 'Import', url: '/import', icon: Upload, allowedRoles: ['admin', 'superadmin'] },
  { title: 'Export', url: '/export', icon: Download, allowedRoles: ['admin', 'superadmin'] },
]

// Function to get sidebar data based on user role
export const getSidebarData = (userRole?: UserRole): SidebarData => {
  const role = userRole || 'user'
  const canSee = (item: SidebarItem) => !item.allowedRoles || item.allowedRoles.includes(role)

  // Lookup helpers
  const byTitle = (title: string) => allSidebarItems.find(i => i.title === title)!

  // Build top-level "Home"
  const home = byTitle('Home')

  // Build top-level "All Meetings"
  const meetings = byTitle('All Meetings')

  // Build Import/Export dropdown (only include children allowed by role)
  const importItem = byTitle('Import')
  const exportItem = byTitle('Export')
  const importExportChildren = [exportItem, importItem].filter(canSee).map(child => ({
    title: child.title,
    url: child.url,
    icon: child.icon,
  }))
  const importExportDropdown = importExportChildren.length
    ? {
        title: 'Import / Export',
        icon: IconUpload, // visual for the group; children have their own icons
        items: importExportChildren,
      }
    : null

  // All other pages grouped under Settings
  const settingsCandidates = allSidebarItems.filter(i =>
    !['Home', 'All Meetings', 'Import', 'Export'].includes(i.title)
  )
  const settingsChildren = settingsCandidates.filter(canSee).map(item => ({
    title: item.title,
    url: item.url,
    icon: item.icon,
  }))
  const settingsDropdown = settingsChildren.length
    ? {
        title: 'Settings',
        icon: IconSettings,
        items: settingsChildren,
      }
    : null

  // Compose final items in requested order
  const items: NavItem[] = []
  if (canSee(home)) {
    items.push({ title: home.title, url: home.url, icon: home.icon })
  }
  if (canSee(meetings)) {
    items.push({ title: meetings.title, url: meetings.url, icon: meetings.icon })
  }
  if (importExportDropdown) items.push(importExportDropdown)
  if (settingsDropdown) items.push(settingsDropdown)

  return {
    user: {
      name: 'Guest User',
      email: 'guest@example.com',
      avatar: '/avatars/default.svg',
    },
    teams: [
      {
        name: 'Minutes',
        logo: Command,
        plan: '',
      },
    ],
    navGroups: [
      {
        title: '',
        items,
      },
    ],
  }
}

// Default sidebar data (for backward compatibility)
export const sidebarData: SidebarData = getSidebarData()
