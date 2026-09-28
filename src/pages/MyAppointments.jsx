import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Clock, MapPin, Hash, Star } from 'lucide-react'
import EmptyState from '../components/EmptyState.jsx'
import ReviewModal from '../components/ReviewModal.jsx'
import { api } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const STATUS_BADGE = {
  requested: { text: 'Requested', color: 'bg-amber-100 text-amber-700' },
  confirmed: { text: 'Confirmed', color: 'bg-mint-500/10 text-mint-700' },
  rejected: { text: 'Declined', color: 'bg-coral/10 text-coral' },
  completed: { text: 'Completed', color: 'bg-navy-900/5 text-navy-900/50' },
  cancelled: { text: 'Cancelled', color: 'bg-navy-900/5 text-navy-900/40' },
  no_show: { text: 'No Show', color: 'bg-coral/10 text-coral' },
}

// Live "X tokens ahead of you" for one confirmed appointment — polls the
// lightweight public queue endpoint every 15s, same cadence as
// NotificationBell.jsx, rather than a full page reload.
function QueueStatus({ appointment }) {
  const [serving, setServing] = useState(null)

  useEffect(() => {
    if (appointment.status !== 'confirmed') return
    const load = () => api.getQueueToday(appointment.doctorId?.id || appointment.doctorId).then((d) => setServing(d.currentServingToken)).catch(() => {})
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [appointment])

  if (appointment.status !== 'confirmed' || serving === null) return null
  const ahead = Math.max(appointment.tokenNumber - serving - 1, 0)
  const isNow = appointment.tokenNumber === serving + 1

  return (
    <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${isNow ? 'bg-teal-600 text-white' : 'bg-skyfaint text-navy-900/70'}`}>
      <Hash size={12} />
      {isNow ? "It's your turn now!" : `Now serving token ${serving} — ${ahead} patient${ahead === 1 ? '' : 's'} ahead of you`}
    </div>
  )
}

export default function MyAppointments() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)

  const load = () => api.myAppointments().then(setAppointments).finally(() => setLoading(false))

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated])

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />

  const cancel = async (id) => {
    setBusyId(id)
    try {
      await api.cancelAppointment(id)
      showToast('Appointment cancelled')
      load()
    } catch (err) {
      showToast(err.message || 'Could not cancel')
    } finally {
      setBusyId(null)
    }
  }

  if (loading || authLoading) return <div className="max-w-2xl mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <h1 className="text-xl md:text-2xl font-display font-bold mb-6">My Appointments</h1>
      {appointments.length === 0 ? (
        <EmptyState icon="📅" title="No appointments yet" message="Book your first appointment with a verified doctor." ctaLabel="Find a Doctor" ctaTo="/doctors" />
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => {
            const badge = STATUS_BADGE[a.status] || STATUS_BADGE.requested
            const doctor = a.doctorId
            return (
              <div key={a.id} className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <Link to={`/doctors/${doctor?.id}`} className="focus-ring text-sm font-semibold hover:text-teal-700">{doctor?.name || 'Doctor'}</Link>
                    <p className="text-xs text-navy-900/40">{doctor?.specialization}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.text}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-navy-900/50 mb-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  {doctor?.city && <span className="flex items-center gap-1"><MapPin size={12} /> {doctor.city}</span>}
                  {a.tokenNumber && <span className="font-semibold text-navy-900">Token #{a.tokenNumber}</span>}
                </div>
                <QueueStatus appointment={a} />
                {['requested', 'confirmed'].includes(a.status) && (
                  <button
                    onClick={() => cancel(a.id)}
                    disabled={busyId === a.id}
                    className="focus-ring mt-3 text-xs font-semibold text-coral disabled:opacity-50"
                  >
                    {busyId === a.id ? 'Cancelling...' : 'Cancel Appointment'}
                  </button>
                )}
                {a.status === 'completed' && !a.reviewed && (
                  <button
                    onClick={() => setReviewTarget(a)}
                    className="focus-ring mt-3 flex items-center gap-1.5 text-xs font-semibold text-teal-700"
                  >
                    <Star size={13} /> Rate this doctor
                  </button>
                )}
                {a.status === 'completed' && a.reviewed && (
                  <p className="mt-3 text-xs text-navy-900/40">You reviewed this appointment. Thanks!</p>
                )}
              </div>
            )
          })}
        </div>
      )}
      {reviewTarget && (
        <ReviewModal
          appointment={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={load}
        />
      )}
    </div>
  )
}
