import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../lib/useTheme'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <FileText size={18} />
          </div>
          <span className="text-slate-900 dark:text-slate-100">MedSimplify</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="btn-secondary !p-2"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <span className="hidden text-sm text-slate-600 dark:text-slate-400 sm:inline">
                {user.full_name}
              </span>
              <button onClick={handleLogout} className="btn-secondary">
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/register" className="btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
