import { Link, Navigate, useNavigate } from 'react-router-dom'
import { User, MapPin, Bell, LogOut, ChevronRight, ShieldCheck, LayoutDashboard, CalendarClock } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

// NOTE: "My Orders", "Prescriptions" and "Wishlist" menu items were removed
// along with the medical-store marketplace. "My Appointments" will replace
// them once the Doctor Appointment System's appointment list page exists.
const menu = [
  { icon: CalendarClock, label: 'My Appointments', to: '/appointments', desc: 'Track and manage your appointments' },
  { icon: MapPin, label: 'Saved Addresses', to: '/profile/addresses', desc: 'Manage your saved addresses' },
  { icon: Bell, label: 'Notifications', to: '/profile/notifications', desc: 'Appointment & platform updates' },
]

export default function Profile() {
  const { user, loading, logout, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  if (loading) return <div className="max-w-2xl mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const handleLogout = () => {
    logout()
    showToast('Logged out')
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
          <User size={28} />
        </div>
        <div>
          <h1 className="text-lg font-display font-bold flex items-center gap-1.5">
            {user?.name}
            {user?.role === 'doctor' && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                <ShieldCheck size={11} /> Doctor
              </span>
            )}
          </h1>
          <p className="text-xs text-navy-900/50">
            {user?.mobile && `+91 ${user.mobile}`}{user?.mobile && user?.email && ' · '}{user?.email}
          </p>
        </div>
      </div>

      {(!user?.name || !user?.hasPassword) && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-skyfaint rounded-xl2 px-4 py-3 mb-6 text-xs">
          <span className="text-navy-900/60">
            {!user?.name ? 'Add your name to complete your profile.' : "You haven't set a password yet — you can still log in with OTP anytime."}
          </span>
          <Link to="/profile/settings" className="focus-ring shrink-0 font-semibold text-teal-700">Complete now →</Link>
        </div>
      )}

      <div className="bg-white rounded-xl2 border border-navy-900/5 shadow-card divide-y divide-navy-900/5">
        {(user?.role === 'doctor' || user?.role === 'doctor_staff') && (
          <Link to="/doctor" className="focus-ring flex items-center gap-3.5 p-4 hover:bg-skyfaint transition-colors bg-teal-50/40">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
              <LayoutDashboard size={17} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{user.role === 'doctor' ? 'Doctor Dashboard' : 'Staff Dashboard'}</p>
              <p className="text-xs text-navy-900/40">Appointments & token queue</p>
            </div>
            <ChevronRight size={16} className="text-navy-900/30" />
          </Link>
        )}
        {menu.map((m) => (
          <Link key={m.label} to={m.to} className="focus-ring flex items-center gap-3.5 p-4 hover:bg-skyfaint transition-colors">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
              <m.icon size={17} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{m.label}</p>
              <p className="text-xs text-navy-900/40">{m.desc}</p>
            </div>
            <ChevronRight size={16} className="text-navy-900/30" />
          </Link>
        ))}
      </div>

      <button onClick={handleLogout} className="focus-ring flex items-center gap-2 text-sm font-semibold text-coral mt-6 px-1">
        <LogOut size={16} /> Log Out
      </button>
    </div>
  )
}
