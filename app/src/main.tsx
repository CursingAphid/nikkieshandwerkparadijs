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
import AdminHeadCategories from './pages/AdminHeadCategories.tsx'
import NewHeadCategory from './pages/NewHeadCategory.tsx'
import CategoryItems from './pages/CategoryItems.tsx'
import NewCategory from './pages/NewCategory.tsx'
import EditCategory from './pages/EditCategory.tsx'
import AdminItems from './pages/AdminItems.tsx'
import AdminLayout from './components/AdminLayout.tsx'
import PublicHeader from './components/PublicHeader.tsx'
import Over from './pages/Over.tsx'
import Haken from './pages/Haken.tsx'
import Borduren from './pages/Borduren.tsx'
import RouteHandler from './components/RouteHandler.tsx'

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
        <Route path="/over" element={<Over />} />
            <Route path="/werkjes/haken" element={<Haken />} />
            <Route path="/werkjes/borduren" element={<Borduren />} />
        <Route path="/werkjes/:type/:param1/:param2/:param3" element={<RouteHandler />} />
        <Route path="/werkjes/:type/:param1/:param2" element={<RouteHandler />} />
        <Route path="/werkjes/:type/:param1" element={<RouteHandler />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAdmin><AdminLayout><Admin /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/items" element={<RequireAdmin><AdminLayout><AdminItems /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/items/new" element={<RequireAdmin><AdminLayout><NewItem /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/items/:id/edit" element={<RequireAdmin><AdminLayout><EditItem /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/categories" element={<RequireAdmin><AdminLayout><AdminCategories /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/categories/new" element={<RequireAdmin><AdminLayout><NewCategory /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/categories/:id/edit" element={<RequireAdmin><AdminLayout><EditCategory /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/categories/:id/items" element={<RequireAdmin><AdminLayout><CategoryItems /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/headcategories" element={<RequireAdmin><AdminLayout><AdminHeadCategories /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/headcategories/new" element={<RequireAdmin><AdminLayout><NewHeadCategory /></AdminLayout></RequireAdmin>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
