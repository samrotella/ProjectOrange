import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Building2, Package, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/buildings', label: 'Buildings', icon: Building2, exact: false },
  { to: '/assets', label: 'Assets', icon: Package, exact: false },
]

export function Layout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={22} />
            <span className="font-bold text-base tracking-tight">CapEx Assess</span>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.exact}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-700' : 'hover:bg-blue-800'}`
                }
              >
                <n.icon size={16} />
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-blue-300 max-w-[140px] truncate">{user?.email}</span>
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-blue-800" title="Sign out">
              <LogOut size={18} />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-2 rounded-lg hover:bg-blue-800">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="sm:hidden border-t border-blue-800 px-4 py-3 flex flex-col gap-1">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.exact}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-700' : 'hover:bg-blue-800'}`
                }
              >
                <n.icon size={17} />
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
