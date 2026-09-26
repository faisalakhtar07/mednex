import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, User, Cross } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import NotificationBell from './NotificationBell.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// NOTE: the old medicines/healthcare/offers nav links, the product SearchBar,
// and the cart/wishlist/store-picker icons have all been removed along with
// the medical-store marketplace.
const navLinks = [
  { to: '/doctors', label: 'Find a Doctor' },
  { to: '/lab-tests', label: 'Lab Tests' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-navy-900/5">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="hidden md:flex items-center gap-6 h-16">
          <Link to="/" className="flex items-center gap-1.5 shrink-0 focus-ring rounded-lg">
            <span className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Cross size={18} />
            </span>
            <span className="text-xl font-display font-extrabold text-navy-900">MedNex</span>
          </Link>

          <nav className="flex-1 flex items-center gap-5 text-sm font-medium">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `focus-ring rounded transition-colors ${isActive ? 'text-teal-700' : 'text-navy-900/70 hover:text-teal-700'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <Link to={isAuthenticated ? '/profile' : '/login'} className="focus-ring text-navy-900/70 hover:text-teal-700" aria-label="Account">
              <User size={19} />
            </Link>
            <NotificationBell />
          </div>
        </div>

        <div className="flex md:hidden items-center justify-between h-14">
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="focus-ring p-1 -m-1" aria-label="Open menu">
            <Menu size={22} />
          </button>
          <Link to="/" className="flex items-center gap-1 focus-ring rounded-lg">
            <span className="w-6 h-6 rounded-md bg-teal-600 flex items-center justify-center text-white">
              <Cross size={13} />
            </span>
            <span className="text-base font-display font-extrabold text-navy-900">MedNex</span>
          </Link>
          <div className="flex items-center gap-3.5">
            <NotificationBell />
          </div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {menuOpen && (
            <div className="md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(10,31,51,0.4)', zIndex: 999998 }}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '288px',
                  maxWidth: '85vw',
                  background: '#ffffff',
                  zIndex: 999999,
                  padding: '20px',
                  overflowY: 'auto',
                  boxShadow: '0 0 40px rgba(0,0,0,0.25)',
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-display font-bold">Menu</span>
                  <button type="button" onClick={() => setMenuOpen(false)} className="focus-ring" aria-label="Close menu">
                    <X size={22} />
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {navLinks.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      onClick={() => setMenuOpen(false)}
                      className="focus-ring px-2 py-2.5 rounded-lg hover:bg-skyfaint text-sm font-medium"
                    >
                      {l.label}
                    </NavLink>
                  ))}
                  <div className="h-px bg-navy-900/10 my-2" />
                  {isAuthenticated ? (
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="focus-ring px-2 py-2.5 rounded-lg hover:bg-skyfaint text-sm font-medium">My Account</Link>
                  ) : (
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="focus-ring px-2 py-2.5 rounded-lg hover:bg-skyfaint text-sm font-medium">Login / Signup</Link>
                  )}
                  <Link to="/profile/notifications" onClick={() => setMenuOpen(false)} className="focus-ring px-2 py-2.5 rounded-lg hover:bg-skyfaint text-sm font-medium">Notifications</Link>
                </nav>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  )
}
