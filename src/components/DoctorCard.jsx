import { Link } from 'react-router-dom'
import { MapPin, Star, Stethoscope } from 'lucide-react'

export default function DoctorCard({ doctor }) {
  return (
    <Link
      to={`/doctors/${doctor.id}`}
      className="focus-ring block bg-white rounded-xl2 border border-navy-900/5 shadow-card hover:shadow-cardHover p-4 transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 overflow-hidden">
          {doctor.photo ? (
            <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <Stethoscope size={22} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{doctor.name}</p>
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
