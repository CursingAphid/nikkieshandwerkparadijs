import { Link, useLocation } from 'react-router-dom'
import HeaderLogo from '../assets/home/header-logo.png'

function PublicHeader() {
  const loc = useLocation()
  const is = (p: string) => loc.pathname === p
  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium ${is(to) ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      {label}
    </Link>
  )
  return (
    <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-[6px] flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2" aria-label="Home">
          <img src={HeaderLogo} alt="Nikkie’s Handwerk Paradijs" className="h-12 w-auto" />
        </Link>
        <nav className="ml-auto flex gap-2">
          {link('/', 'Start')}
          {link('/build', 'Stel je eigen set samen')}
        </nav>
      </div>
    </div>
  )
}

export default PublicHeader


