import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Upload from './pages/Upload.tsx'
import NewItem from './pages/NewItem.tsx'
import Admin from './pages/Admin.tsx'
import EditItem from './pages/EditItem.tsx'
import AdminLogin from './pages/AdminLogin.tsx'
import RequireAdmin from './components/RequireAdmin.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <div style={{ padding: 12, display: 'flex', gap: 12 }}>
        <Link to="/">Home</Link>
      </div>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="/admin/items/new" element={<RequireAdmin><NewItem /></RequireAdmin>} />
        <Route path="/admin/items/:id/edit" element={<RequireAdmin><EditItem /></RequireAdmin>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
