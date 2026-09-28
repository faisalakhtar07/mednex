import { Link } from 'react-router-dom'
import { MapPin, Star, Stethoscope, Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../utils/api.js'

export default function DoctorCard({ doctor }) {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const isFavorited = isAuthenticated && user?.role === 'customer' && user?.favoriteDoctors?.some((id) => String(id) === String(doctor.id))

  const toggleFavorite = async (e) => {
    e.preventDefault() // don't navigate to the doctor page when tapping the heart
    e.stopPropagation()
    if (!isAuthenticated) return
    try {
      await api.toggleFavoriteDoctor(doctor.id)
      refreshUser()
    } catch (err) {
      // silent — favoriting is a nice-to-have, not worth interrupting browsing with a toast
    }
  }

  return (
    <Link
      to={`/doctors/${doctor.id}`}
      className="focus-ring relative block bg-white rounded-xl2 border border-navy-900/5 shadow-card hover:shadow-cardHover p-4 transition-shadow"
    >
      {isAuthenticated && user?.role === 'customer' && (
        <button
          onClick={toggleFavorite}
          className="focus-ring absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm"
          aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart size={15} className={isFavorited ? 'text-coral fill-coral' : 'text-navy-900/30'} />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 overflow-hidden">
          {doctor.photo ? (
            <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <Stethoscope size={22} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate pr-6">{doctor.name}</p>
          <p className="text-xs text-navy-900/50 mb-1">{doctor.specialization}{doctor.qualification ? ` · ${doctor.qualification}` : ''}</p>
          <div className="flex items-center gap-1 text-[11px] text-navy-900/40 mb-1.5">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{doctor.clinicName ? `${doctor.clinicName}, ` : ''}{doctor.city}</span>
          </div>
          <div className="flex items-center justify-between">
            {doctor.ratingCount > 0 ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-navy-900/60">
                <Star size={12} className="text-amber-500 fill-amber-500" /> {doctor.ratingAvg?.toFixed(1)} ({doctor.ratingCount})
              </span>
            ) : (
              <span className="text-[11px] text-navy-900/30">New on MedNex</span>
            )}
            <span className="text-sm font-bold text-teal-700">₹{doctor.consultationFee}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
