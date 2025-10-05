import { Link, useLocation } from 'react-router-dom'

function AdminHeader() {
  const loc = useLocation()
  const is = (p: string) => {
    if (p === '/admin') return loc.pathname === '/admin'
    return loc.pathname.startsWith(p)
  }
  const link = (to: string, label: string) => (
    <Link
      to={to}
      className="btn"
      style={{
        background: is(to) ? '#111827' : undefined,
        color: is(to) ? '#fff' : undefined,
      }}
    >
      {label}
    </Link>
  )
  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
      <div className="text-base font-semibold">Admin</div>
      <div className="ml-3 flex gap-2">
        {link('/admin', 'Dashboard')}
        {link('/admin/categories', 'Categories')}
        {link('/admin/items', 'Items')}
        {link('/admin/categories/new', 'New Category')}
        {link('/admin/items/new', 'New Item')}
      </div>
      <div className="ml-auto">
        <form method="post" action="#" onSubmit={async (e) => {
          e.preventDefault()
          await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
          window.location.href = '/admin/login'
        }}>
          <button className="btn" type="submit">Logout</button>
        </form>
      </div>
    </div>
  )
}

export default AdminHeader


