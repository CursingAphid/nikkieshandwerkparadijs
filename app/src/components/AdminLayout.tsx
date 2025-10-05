import type { ReactNode } from 'react'
import AdminHeader from './AdminHeader'

function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

export default AdminLayout


