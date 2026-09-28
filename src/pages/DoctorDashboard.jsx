import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { CalendarCheck, Users, CreditCard, PhoneCall, Check, X, ShieldAlert, ShieldCheck, Clock, Plus } from 'lucide-react'
import Button from '../components/Button.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { loadRazorpayScript } from '../utils/razorpay.js'

const TABS = [
  { key: 'requests', label: 'Requests', icon: CalendarCheck },
  { key: 'queue', label: 'Live Queue', icon: PhoneCall },
  { key: 'staff', label: 'Staff', icon: Users, doctorOnly: true },
  { key: 'subscription', label: 'Subscription', icon: CreditCard, doctorOnly: true },
]

/* ---------- Requests tab: pending + confirmed appointments ---------- */
function RequestsTab({ showToast }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')

  const load = () => api.dashboardAppointments().then(setAppointments).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const act = async (fn, id) => {
    setBusyId(id)
    try {
      await fn(id)
      load()
    } catch (err) {
      showToast(err.message || 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  const submitReject = async () => {
    if (!rejectTarget) return
    setBusyId(rejectTarget)
    try {
      await api.rejectAppointment(rejectTarget, reason)
      setRejectTarget(null); setReason('')
      load()
    } catch (err) {
      showToast(err.message || 'Could not decline')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-sm text-navy-900/40 py-8 text-center">Loading...</p>

  const requested = appointments.filter((a) => a.status === 'requested')
  const confirmed = appointments.filter((a) => a.status === 'confirmed')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Pending Requests ({requested.length})</h3>
        {requested.length === 0 ? (
          <p className="text-xs text-navy-900/40">No pending requests.</p>
        ) : (
          <div className="space-y-2.5">
            {requested.map((a) => (
              <div key={a.id} className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{a.patientName}</p>
                  <p className="text-xs text-navy-900/40">{a.patientPhone} · {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  {a.patientNote && <p className="text-xs text-navy-900/50 mt-1 italic">"{a.patientNote}"</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => act(api.confirmAppointment, a.id)} disabled={busyId === a.id} className="focus-ring w-8 h-8 rounded-full bg-mint-500/10 text-mint-700 flex items-center justify-center disabled:opacity-50" aria-label="Confirm">
                    <Check size={15} />
                  </button>
                  <button onClick={() => setRejectTarget(a.id)} disabled={busyId === a.id} className="focus-ring w-8 h-8 rounded-full bg-coral/10 text-coral flex items-center justify-center disabled:opacity-50" aria-label="Decline">
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Confirmed — Upcoming ({confirmed.length})</h3>
        {confirmed.length === 0 ? (
          <p className="text-xs text-navy-900/40">No confirmed appointments yet.</p>
        ) : (
          <div className="space-y-2.5">
            {confirmed.map((a) => (
              <div key={a.id} className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">Token #{a.tokenNumber} — {a.patientName}</p>
                  <p className="text-xs text-navy-900/40">{a.patientPhone} · {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => act(api.completeAppointment, a.id)} disabled={busyId === a.id} className="focus-ring text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-teal-50 text-teal-700 disabled:opacity-50">Complete</button>
                  <button onClick={() => act(api.markNoShow, a.id)} disabled={busyId === a.id} className="focus-ring text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-navy-900/5 text-navy-900/50 disabled:opacity-50">No Show</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Decline Appointment">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" rows={3} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm mb-4" />
        <Button variant="coral" className="w-full" onClick={submitReject} disabled={busyId === rejectTarget}>Decline Appointment</Button>
      </Modal>
    </div>
  )
}

/* ---------- Live Queue tab ---------- */
function QueueTab({ showToast }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(false)

  const load = () => api.dashboardQueueToday().then(setData).finally(() => setLoading(false))
  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const callNext = async () => {
    setCalling(true)
    try {
      await api.callNextToken()
      load()
    } catch (err) {
      showToast(err.message || 'No more patients waiting')
    } finally {
      setCalling(false)
    }
  }

  if (loading) return <p className="text-sm text-navy-900/40 py-8 text-center">Loading...</p>
  const waiting = data.queue.filter((q) => q.status === 'confirmed')

  return (
    <div>
      <div className="bg-navy-950 text-white rounded-xl2 p-6 text-center mb-6">
        <p className="text-xs text-white/50 mb-1">Now Serving</p>
        <p className="text-5xl font-display font-extrabold mb-4">{data.currentServingToken || '—'}</p>
        <Button variant="primary" onClick={callNext} disabled={calling || waiting.length === 0}>
          <PhoneCall size={15} /> {calling ? 'Calling...' : 'Call Next Patient'}
        </Button>
      </div>
      <h3 className="text-sm font-semibold mb-3">Today's Queue ({data.queue.length})</h3>
      {data.queue.length === 0 ? (
        <p className="text-xs text-navy-900/40">No confirmed appointments today.</p>
      ) : (
        <div className="space-y-2">
          {data.queue.map((a) => (
            <div key={a.id} className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${a.tokenNumber <= data.currentServingToken ? 'border-navy-900/5 bg-skyfaint text-navy-900/40' : 'border-navy-900/10 bg-white'}`}>
              <span className="font-semibold">#{a.tokenNumber} {a.patientName}</span>
              <span className="text-xs capitalize">{a.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Staff tab (doctor only) ---------- */
function StaffTab({ showToast }) {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' })
  const [saving, setSaving] = useState(false)

  const load = () => api.myStaff().then(setStaff).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const addStaff = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.staffAdd(form)
      showToast('Staff account created')
      setShowAdd(false)
      setForm({ name: '', email: '', mobile: '', password: '' })
      load()
    } catch (err) {
      showToast(err.message || 'Could not add staff')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (s) => {
    try {
      await api.setStaffActive(s.id, !s.active)
      load()
    } catch (err) {
      showToast(err.message || 'Could not update staff')
    }
  }

  if (loading) return <p className="text-sm text-navy-900/40 py-8 text-center">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Staff Accounts ({staff.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Staff</Button>
      </div>
      {staff.length === 0 ? (
        <p className="text-xs text-navy-900/40">No staff added yet. Staff can confirm bookings and manage your live queue on your behalf.</p>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-navy-900/10 bg-white text-sm">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-navy-900/40">{s.email}</p>
              </div>
              <button onClick={() => toggleActive(s)} className={`focus-ring text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.active ? 'bg-mint-500/10 text-mint-700' : 'bg-navy-900/5 text-navy-900/40'}`}>
                {s.active ? 'Active' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Staff Account">
        <form onSubmit={addStaff} className="space-y-3">
          <input required placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <input required type="tel" placeholder="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <input required type="password" minLength={6} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Adding...' : 'Add Staff'}</Button>
        </form>
      </Modal>
    </div>
  )
}

/* ---------- Subscription tab (doctor only) ---------- */
function SubscriptionTab({ doctor, showToast, onDoctorUpdate }) {
  const [plans, setPlans] = useState([])
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingPlanId, setPayingPlanId] = useState(null)
  const [startingTrial, setStartingTrial] = useState(false)

  const load = () => Promise.all([api.getPlans(), api.getMySubscriptions()]).then(([p, s]) => { setPlans(p); setSubs(s) }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  // Paid plans only — the system-managed free-trial plan (isFreeTrial) is
  // never bought through here, only via startTrial() below, so it's kept
  // out of this grid to avoid two confusing "free" cards.
  const paidPlans = plans.filter((p) => !p.isFreeTrial)

  const startTrial = async () => {
    setStartingTrial(true)
    try {
      await api.startFreeTrial() // never touches Razorpay — activated directly on the backend
      showToast('Your 15-day free trial has started!')
      onDoctorUpdate?.()
      load()
    } catch (err) {
      showToast(err.message || 'Could not start free trial')
    } finally {
      setStartingTrial(false)
    }
  }

  const subscribe = async (planId) => {
    setPayingPlanId(planId)
    try {
      const subscription = await api.subscribeToPlan(planId)
      const order = await api.createSubscriptionOrder(subscription.id)

      // Free (₹0) plans are activated directly on the backend — no Razorpay
      // checkout to open at all (see routes/paymentRoutes.js).
      if (order.free) {
        showToast('Subscription activated!')
        onDoctorUpdate?.()
        load()
        return
      }

      const keyInfo = await api.getRazorpayKey()
      if (!keyInfo.configured) {
        showToast('Online payments are not configured on the server yet')
        return
      }
      const loaded = await loadRazorpayScript()
      if (!loaded) { showToast('Could not load payment gateway'); return }
      const rzp = new window.Razorpay({
        key: keyInfo.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'MedNex',
        description: `${order.planName} Subscription`,
        order_id: order.razorpayOrderId,
        prefill: { name: order.doctorName, contact: order.doctorPhone },
        theme: { color: '#0E9C90' },
        handler: async (response) => {
          try {
            await api.verifySubscriptionPayment({ subscriptionId: subscription.id, ...response })
            showToast('Subscription activated!')
            onDoctorUpdate?.()
            load()
          } catch (err) {
            showToast(err.message || 'Payment verification failed')
          }
        },
      })
      rzp.open()
    } catch (err) {
      showToast(err.message || 'Could not start subscription')
    } finally {
      setPayingPlanId(null)
    }
  }

  if (loading) return <p className="text-sm text-navy-900/40 py-8 text-center">Loading...</p>

  return (
    <div>
      <div className={`rounded-xl2 p-4 mb-6 text-sm font-medium ${doctor.subscriptionStatus === 'active' ? 'bg-mint-500/10 text-mint-700' : 'bg-amber-50 text-amber-800'}`}>
        {doctor.subscriptionStatus === 'active'
          ? "Your subscription is active — you're visible to patients."
          : 'No active subscription — patients cannot find you in search until you subscribe.'}
      </div>

      {!doctor.hasUsedFreeTrial && doctor.subscriptionStatus !== 'active' && (
        <div className="rounded-xl2 p-4 mb-6 bg-teal-50 border border-teal-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-teal-800">New here? Try MedNex free for 15 days</p>
            <p className="text-xs text-teal-700/70">No payment required — activates instantly.</p>
          </div>
          <Button size="sm" onClick={startTrial} disabled={startingTrial}>
            {startingTrial ? 'Starting...' : 'Start 15-Day Free Trial'}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paidPlans.map((p) => (
          <div key={p.id} className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-4">
            <p className="text-sm font-semibold">{p.name}</p>
            <p className="text-2xl font-display font-bold text-teal-700 my-1.5">₹{p.price}</p>
            <ul className="text-xs text-navy-900/50 space-y-1 mb-4">
              {(p.features || []).map((f) => <li key={f}>• {f}</li>)}
            </ul>
            <Button size="sm" className="w-full" onClick={() => subscribe(p.id)} disabled={payingPlanId === p.id}>
              {payingPlanId === p.id ? 'Processing...' : 'Subscribe'}
            </Button>
          </div>
        ))}
      </div>
      {subs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Billing History</h3>
          <div className="space-y-1.5">
            {subs.map((s) => (
              <div key={s.id} className="flex justify-between text-xs text-navy-900/50 px-3 py-2 bg-skyfaint rounded-lg">
                <span>{s.planId?.name}</span>
                <span className="capitalize">{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DoctorDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('requests')

  const isDoctor = user?.role === 'doctor'
  const isStaff = user?.role === 'doctor_staff'

  const loadDoctor = () => api.getMyDoctorProfile().then(setDoctor).catch(() => setDoctor(null)).finally(() => setLoading(false))
  useEffect(() => {
    if (!isAuthenticated || (!isDoctor && !isStaff)) { setLoading(false); return }
    if (isStaff) { setLoading(false); return } // staff have no profile of their own to load
    loadDoctor()
  }, [isAuthenticated, isDoctor, isStaff])

  if (!authLoading && (!isAuthenticated || (!isDoctor && !isStaff))) return <Navigate to="/staff/login" replace />
  if (loading || authLoading) return <div className="max-w-3xl mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading...</div>
  if (isDoctor && !doctor) return <Navigate to="/doctor/register" replace />

  const visibleTabs = TABS.filter((t) => !t.doctorOnly || isDoctor)

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl md:text-2xl font-display font-bold">{isDoctor ? doctor?.name : 'Staff Dashboard'}</h1>
        {isDoctor && (
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${doctor.verificationStatus === 'approved' ? 'bg-mint-500/10 text-mint-700' : doctor.verificationStatus === 'rejected' ? 'bg-coral/10 text-coral' : 'bg-amber-50 text-amber-700'}`}>
            {doctor.verificationStatus === 'approved' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
            {doctor.verificationStatus === 'approved' ? 'Verified' : doctor.verificationStatus === 'rejected' ? 'Rejected' : 'Pending Verification'}
          </span>
        )}
      </div>
      {isDoctor && <p className="text-sm text-navy-900/40 mb-6">{doctor.specialization} · {doctor.city}</p>}
      {isStaff && <p className="text-sm text-navy-900/40 mb-6">You're managing appointments on behalf of your doctor.</p>}

      {isDoctor && doctor.verificationStatus === 'pending' && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 rounded-xl2 p-3.5 mb-6 text-xs">
          <Clock size={15} className="shrink-0" /> Your profile is awaiting admin approval — you won't appear in patient search until it's approved.
        </div>
      )}

      <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-none">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`focus-ring shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors ${tab === t.key ? 'bg-navy-950 text-white' : 'bg-skyfaint text-navy-900/60'}`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'requests' && <RequestsTab showToast={showToast} />}
      {tab === 'queue' && <QueueTab showToast={showToast} />}
      {tab === 'staff' && isDoctor && <StaffTab showToast={showToast} />}
      {tab === 'subscription' && isDoctor && <SubscriptionTab doctor={doctor} showToast={showToast} onDoctorUpdate={loadDoctor} />}
    </div>
  )
}
