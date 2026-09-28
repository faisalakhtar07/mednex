import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Star, Stethoscope, CheckCircle2 } from 'lucide-react'
import Button from '../components/Button.jsx'
import { api } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function nextNDays(n) {
  const days = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export default function DoctorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(nextNDays(7)[0])
  const [note, setNote] = useState('')
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewPage, setReviewPage] = useState(1)
  const [hasMoreReviews, setHasMoreReviews] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(false)

  useEffect(() => {
    api.getDoctor(id).then(setDoctor).catch(() => setDoctor(null)).finally(() => setLoading(false))
  }, [id])

  const loadReviews = (page = 1) => {
    setLoadingReviews(true)
    api.getDoctorReviews(id, page)
      .then((d) => {
        setReviews((prev) => (page === 1 ? d.reviews : [...prev, ...d.reviews]))
        setHasMoreReviews(d.hasMore)
        setReviewPage(page)
      })
      .finally(() => setLoadingReviews(false))
  }

  useEffect(() => { loadReviews(1) }, [id])

  const confirmBooking = async () => {
    if (!isAuthenticated) {
      showToast('Please login to book an appointment')
      navigate('/login')
      return
    }
    setBooking(true)
    try {
      const appt = await api.bookAppointment({ doctorId: id, date: selectedDate.toISOString(), patientNote: note })
      setBooked(appt)
      showToast('Appointment requested')
    } catch (err) {
      showToast(err.message || 'Could not book appointment')
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading...</div>
  if (!doctor) return <div className="max-w-2xl mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Doctor not found.</div>

  if (booked) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-mint-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={40} className="text-mint-600" />
        </div>
        <h1 className="text-xl font-display font-bold mb-2">Appointment Requested</h1>
        <p className="text-sm text-navy-900/50 mb-8">
          Your request has been sent to {doctor.name}. You'll get a token number once it's confirmed — track it from My Appointments.
        </p>
        <Button as={Link} to="/appointments">View My Appointments</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <div className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 overflow-hidden">
            {doctor.photo ? <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover" /> : <Stethoscope size={26} />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold">{doctor.name}</h1>
            <p className="text-sm text-navy-900/50 mb-2">{doctor.specialization}{doctor.qualification ? ` · ${doctor.qualification}` : ''}{doctor.experience ? ` · ${doctor.experience}` : ''}</p>
            {doctor.ratingCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-navy-900/60 mb-1">
                <Star size={13} className="text-amber-500 fill-amber-500" /> {doctor.ratingAvg?.toFixed(1)} ({doctor.ratingCount} reviews)
              </span>
            )}
          </div>
          <p className="text-lg font-bold text-teal-700 shrink-0">₹{doctor.consultationFee}</p>
        </div>

        <div className="mt-4 pt-4 border-t border-navy-900/5 space-y-2 text-sm text-navy-900/70">
          {doctor.clinicName && <p className="font-medium">{doctor.clinicName}</p>}
          <p className="flex items-center gap-2"><MapPin size={14} className="text-navy-900/40 shrink-0" /> {doctor.clinicAddress ? `${doctor.clinicAddress}, ` : ''}{doctor.city}{doctor.state ? `, ${doctor.state}` : ''}</p>
          {doctor.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-navy-900/40 shrink-0" /> {doctor.phone}</p>}
          {doctor.availableTime && <p className="flex items-center gap-2"><Clock size={14} className="text-navy-900/40 shrink-0" /> {doctor.availableTime}</p>}
        </div>

        {doctor.description && <p className="mt-4 pt-4 border-t border-navy-900/5 text-sm text-navy-900/60 leading-relaxed">{doctor.description}</p>}
      </div>

      <div className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-5">
        <h2 className="text-sm font-semibold mb-3">Book an Appointment</h2>
        <p className="text-xs text-navy-900/40 mb-3">Pick a day — you'll get a live token number once the clinic confirms your booking.</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-4">
          {nextNDays(7).map((d) => {
            const isSelected = d.toDateString() === selectedDate.toDateString()
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDate(d)}
                className={`focus-ring shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl border text-xs font-semibold transition-colors ${
                  isSelected ? 'bg-navy-950 text-white border-navy-950' : 'border-navy-900/15 text-navy-900/60'
                }`}
              >
                <span className="text-[10px] font-normal opacity-70">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                <span className="text-base">{d.getDate()}</span>
              </button>
            )
          })}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything you'd like the doctor to know (optional)"
          rows={2}
          className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm mb-4"
        />
        <Button className="w-full" onClick={confirmBooking} disabled={booking}>
          {booking ? 'Requesting...' : `Request Appointment for ${selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
        </Button>
      </div>

      <div className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-5 mt-6">
        <h2 className="text-sm font-semibold mb-4">
          Patient Reviews {doctor.ratingCount > 0 && <span className="font-normal text-navy-900/40">({doctor.ratingCount})</span>}
        </h2>
        {reviews.length === 0 && !loadingReviews ? (
          <p className="text-xs text-navy-900/40">No reviews yet — be the first to visit and share your experience.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-navy-900/5 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold">{r.patientName}</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={13} className={n <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-navy-900/15'} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-xs text-navy-900/60 leading-relaxed">{r.comment}</p>}
                <p className="text-[10px] text-navy-900/30 mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            ))}
          </div>
        )}
        {hasMoreReviews && (
          <button
            onClick={() => loadReviews(reviewPage + 1)}
            disabled={loadingReviews}
            className="focus-ring mt-4 text-xs font-semibold text-teal-700 disabled:opacity-50"
          >
            {loadingReviews ? 'Loading...' : 'Load more reviews'}
          </button>
        )}
      </div>
    </div>
  )
}
