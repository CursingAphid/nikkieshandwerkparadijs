import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import './index.css'
// App is not used; routes mount pages directly
import Home from './pages/Home.tsx'
import Build from './pages/Build.tsx'
import NewItem from './pages/NewItem.tsx'
import Admin from './pages/Admin.tsx'
import EditItem from './pages/EditItem.tsx'
import AdminLogin from './pages/AdminLogin.tsx'
import RequireAdmin from './components/RequireAdmin.tsx'
import AdminCategories from './pages/AdminCategories.tsx'
import CategoryItems from './pages/CategoryItems.tsx'
import NewCategory from './pages/NewCategory.tsx'
import EditCategory from './pages/EditCategory.tsx'
import AdminItems from './pages/AdminItems.tsx'
import AdminLayout from './components/AdminLayout.tsx'
import PublicHeader from './components/PublicHeader.tsx'

function ShellHeader() {
  const loc = useLocation()
  const isAdmin = loc.pathname.startsWith('/admin')
  if (isAdmin) return null
  return <PublicHeader />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ShellHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/build" element={<Build />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAdmin><AdminLayout><Admin /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/items" element={<RequireAdmin><AdminLayout><AdminItems /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/items/new" element={<RequireAdmin><AdminLayout><NewItem /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/items/:id/edit" element={<RequireAdmin><AdminLayout><EditItem /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/categories" element={<RequireAdmin><AdminLayout><AdminCategories /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/categories/new" element={<RequireAdmin><AdminLayout><NewCategory /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/categories/:id/edit" element={<RequireAdmin><AdminLayout><EditCategory /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/categories/:id/items" element={<RequireAdmin><AdminLayout><CategoryItems /></AdminLayout></RequireAdmin>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
