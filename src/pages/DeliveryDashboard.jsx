import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Phone, MapPin, IndianRupee, LogOut, Package, ShieldCheck, KeyRound, Store, Wallet, Power, Radio, Zap } from 'lucide-react'
import Button from '../components/Button.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

// The forward-only workflow (spec section 8) — each entry is what button to
// show while an assignment is in that status, and which action it triggers.
// 'Reached Store' and 'Reached Customer' don't have a plain "next status"
// button; they open the pickup-code / OTP modals instead (see below), which
// are the only ways to advance past those two steps.
const NEXT_STEP = {
  Assigned: { label: 'Accept delivery', action: 'accept' },
  Accepted: { label: 'Going to store', action: 'status', next: 'Going to Store' },
  'Going to Store': { label: 'Reached store', action: 'status', next: 'Reached Store' },
  'Reached Store': { label: 'Enter pickup code', action: 'pickup' },
  'Picked Up': { label: 'Going to customer', action: 'status', next: 'Going to Customer' },
  'Going to Customer': { label: 'Reached customer', action: 'status', next: 'Reached Customer' },
  'Reached Customer': { label: 'Enter delivery OTP', action: 'deliver' },
}

export default function DeliveryDashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [broadcasting, setBroadcasting] = useState([])
  const [claimingId, setClaimingId] = useState(null)
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [togglingOnline, setTogglingOnline] = useState(false)

  const [pickupModal, setPickupModal] = useState(null) // assignment
  const [pickupInput, setPickupInput] = useState('')
  const [pickupError, setPickupError] = useState('')

  const [otpModal, setOtpModal] = useState(null) // assignment
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState('')

  const isPlatformRider = profile?.deliveryProfile?.scope === 'platform'

  const load = () => {
    api.deliveryAssignments().then(setAssignments)
    api.deliveryEarnings().then(setEarnings)
  }

  useEffect(() => {
    if (user?.role !== 'delivery') return
    setLoading(true)
    Promise.all([api.deliveryProfile(), api.deliveryAssignments(), api.deliveryEarnings()])
      .then(([p, a, e]) => { setProfile(p); setAssignments(a); setEarnings(e) })
      .finally(() => setLoading(false))
  }, [user])

  // Poll every 10s so newly assigned deliveries show up without a manual refresh.
  useEffect(() => {
    if (user?.role !== 'delivery') return
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [user])

  // The broadcast pool — every online+approved platform rider polls this
  // separately and faster (5s) than the assigned-deliveries list, since a
  // broadcast is only useful if seen before someone else claims it (spec
  // section 8: "sabse pehle confirm kare use mile").
  useEffect(() => {
    if (user?.role !== 'delivery' || !isPlatformRider) return
    const fetchBroadcasts = () => api.broadcastingAssignments().then(setBroadcasting).catch(() => {})
    fetchBroadcasts()
    const interval = setInterval(fetchBroadcasts, 5000)
    return () => clearInterval(interval)
  }, [user, isPlatformRider])

  if (!authLoading && !isAuthenticated) return <Navigate to="/staff/login" replace />
  if (!authLoading && user && user.role !== 'delivery') return <Navigate to="/" replace />
  if (authLoading || loading) return <div className="max-w-2xl mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading your deliveries...</div>

  const isApproved = profile?.deliveryProfile?.verificationStatus === 'approved'
  const isOnline = profile?.deliveryProfile?.availability === 'online'

  const toggleOnline = async () => {
    setTogglingOnline(true)
    try {
      const updated = await api.setDeliveryAvailability(isOnline ? 'offline' : 'online')
      setProfile(updated)
    } catch (err) {
      showToast(err.message || 'Could not update availability')
    } finally {
      setTogglingOnline(false)
    }
  }

  // First request wins, atomically, on the backend — a 409 here means
  // another rider claimed it a moment earlier. That's an expected outcome
  // of the broadcast model, not an error, so it gets a plain toast instead
  // of the generic error handling other actions use.
  const claimBroadcast = async (assignment) => {
    setClaimingId(assignment.id)
    try {
      await api.claimAssignment(assignment.id)
      showToast('Claimed! Head to the store to pick it up.')
      setBroadcasting((list) => list.filter((a) => a.id !== assignment.id))
      load()
    } catch (err) {
      if (err.message?.toLowerCase().includes('claimed by another rider')) {
        showToast('Too late — another rider already claimed this one')
        setBroadcasting((list) => list.filter((a) => a.id !== assignment.id))
      } else {
        showToast(err.message || 'Could not claim this delivery')
      }
    } finally {
      setClaimingId(null)
    }
  }

  const runAction = async (assignment, fn) => {
    setBusyId(assignment.id)
    try {
      await fn()
      load()
    } catch (err) {
      showToast(err.message || 'Could not update this delivery')
    } finally {
      setBusyId(null)
    }
  }

  const handleStep = (assignment) => {
    const step = NEXT_STEP[assignment.status]
    if (!step) return
    if (step.action === 'accept') return runAction(assignment, () => api.acceptAssignment(assignment.id))
    if (step.action === 'status') return runAction(assignment, () => api.updateAssignmentStatus(assignment.id, step.next))
    if (step.action === 'pickup') { setPickupModal(assignment); setPickupInput(''); setPickupError('') }
    if (step.action === 'deliver') { setOtpModal(assignment); setOtpInput(''); setOtpError('') }
  }

  const submitPickup = async () => {
    if (!pickupModal) return
    setBusyId(pickupModal.id)
    setPickupError('')
    try {
      await api.verifyPickupCode(pickupModal.id, pickupInput.trim())
      showToast('Pickup confirmed — head to the customer')
      setPickupModal(null)
      load()
    } catch (err) {
      setPickupError(err.message || 'Incorrect pickup code')
    } finally {
      setBusyId(null)
    }
  }

  const submitDeliver = async () => {
    if (!otpModal) return
    setBusyId(otpModal.id)
    setOtpError('')
    try {
      await api.completeDelivery(otpModal.id, otpInput.trim())
      showToast('Delivery confirmed ✅')
      setOtpModal(null)
      load()
    } catch (err) {
      setOtpError(err.message || 'Incorrect OTP')
    } finally {
      setBusyId(null)
    }
  }

  const active = assignments.filter((a) => a.status !== 'Delivered' && a.status !== 'Cancelled')
  const completed = assignments.filter((a) => a.status === 'Delivered')

  return (
    <div className="max-w-2xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <div className="flex items-center justify-between mb-1.5">
        <h1 className="text-xl md:text-2xl font-display font-bold">My Deliveries</h1>
        <button onClick={() => { logout(); navigate('/') }} className="focus-ring flex items-center gap-1.5 text-xs font-semibold text-coral">
          <LogOut size={14} /> Logout
        </button>
      </div>
      <p className="text-sm text-navy-900/50 mb-4">Welcome, {user?.name}</p>

      {!isApproved ? (
        <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded-xl2 px-4 py-3 mb-6 text-xs font-medium">
          Your account is awaiting Super Admin verification. You can't go online or receive deliveries until you're approved.
        </div>
      ) : (
        <button
          onClick={toggleOnline}
          disabled={togglingOnline}
          className={`focus-ring w-full flex items-center justify-center gap-2 rounded-xl2 px-4 py-3 mb-6 text-sm font-semibold border transition-colors disabled:opacity-50 ${
            isOnline ? 'bg-mint-500/10 border-mint-500/30 text-mint-700' : 'bg-navy-900/5 border-navy-900/10 text-navy-900/50'
          }`}
        >
          <Power size={15} /> {isOnline ? "You're online — receiving deliveries" : "You're offline — tap to go online"}
        </button>
      )}

      {earnings && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-3 text-center">
            <p className="text-lg font-bold">₹{earnings.todayEarnings}</p>
            <p className="text-[10px] text-navy-900/40">Today</p>
          </div>
          <div className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-3 text-center">
            <p className="text-lg font-bold">₹{earnings.pendingPayout}</p>
            <p className="text-[10px] text-navy-900/40">Pending payout</p>
          </div>
          <div className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-3 text-center">
            <p className="text-lg font-bold">{earnings.totalDeliveries}</p>
            <p className="text-[10px] text-navy-900/40">Total deliveries</p>
          </div>
        </div>
      )}

      {isPlatformRider && isOnline && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Radio size={14} className="text-teal-600" /> Available Deliveries
            {broadcasting.length > 0 && <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">{broadcasting.length}</span>}
          </h2>
          {broadcasting.length === 0 ? (
            <p className="text-xs text-navy-900/40 py-2">No deliveries broadcasting right now — you'll get a notification the moment one comes in.</p>
          ) : (
            <div className="space-y-2">
              {broadcasting.map((b) => (
                <div key={b.id} className="bg-white rounded-xl2 border border-teal-200 shadow-card p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="flex items-center gap-1.5 text-sm font-semibold"><Store size={13} className="text-navy-900/40" /> {b.storeId?.storeName}</p>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-teal-700"><Zap size={11} /> First to accept gets it</span>
                  </div>
                  <p className="flex items-start gap-1.5 text-xs text-navy-900/50 mb-2">
                    <MapPin size={12} className="mt-0.5 shrink-0" /> {b.storeId?.city} - {b.storeId?.pinCode}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1 text-sm font-bold"><IndianRupee size={13} /> {b.deliveryBoyEarning}</p>
                    <Button size="sm" onClick={() => claimBroadcast(b)} disabled={claimingId === b.id}>
                      {claimingId === b.id ? 'Claiming...' : 'Accept'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {active.length === 0 ? (
        <div className="text-center py-10">
          <Package size={32} className="text-navy-900/20 mx-auto mb-2" />
          <p className="text-sm text-navy-900/40">No active deliveries assigned to you right now.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {active.map((a) => {
            const step = NEXT_STEP[a.status]
            const isPickupPhase = ['Assigned', 'Accepted', 'Going to Store', 'Reached Store'].includes(a.status)
            return (
              <div key={a.id} className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold">{a.orderId?.orderNumber}</p>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">{a.status}</span>
                </div>

                {isPickupPhase ? (
                  <>
                    <p className="flex items-center gap-1.5 text-sm font-medium mb-0.5">
                      <Store size={13} className="text-navy-900/40" /> {a.storeId?.storeName}
                    </p>
                    <p className="flex items-start gap-1.5 text-xs text-navy-900/50 mb-2">
                      <MapPin size={12} className="mt-0.5 shrink-0" /> {a.storeId?.address}, {a.storeId?.city} - {a.storeId?.pinCode}
                    </p>
                    {a.storeId?.phone && (
                      <p className="flex items-center gap-1.5 text-xs text-navy-900/50 mb-2">
                        <Phone size={12} /> {a.storeId.phone}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-0.5">{a.orderId?.user?.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-navy-900/50 mb-1">
                      <Phone size={12} /> {a.orderId?.address?.mobile || a.orderId?.user?.mobile}
                    </p>
                    <p className="flex items-start gap-1.5 text-xs text-navy-900/50 mb-2">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      {a.orderId?.address?.house}, {a.orderId?.address?.street}, {a.orderId?.address?.area}, {a.orderId?.address?.city} - {a.orderId?.address?.pin}
                    </p>
                  </>
                )}

                <p className="flex items-center gap-1 text-sm font-bold mb-3">
                  <IndianRupee size={13} /> {a.deliveryBoyEarning} <span className="text-[11px] font-normal text-navy-900/40 ml-1">your earning for this delivery</span>
                </p>

                {step && (
                  <Button size="sm" onClick={() => handleStep(a)} disabled={busyId === a.id}>
                    {step.action === 'pickup' && <KeyRound size={14} />}
                    {step.action === 'deliver' && <ShieldCheck size={14} />}
                    {busyId === a.id ? 'Updating...' : step.label}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {completed.length > 0 && (
        <>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Wallet size={14} /> Completed</h2>
          <div className="space-y-2">
            {completed.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-skyfaint rounded-xl px-4 py-3">
                <span className="text-xs font-medium">{a.orderId?.orderNumber} · {a.orderId?.user?.name}</span>
                <span className="text-[11px] text-mint-600 font-semibold">₹{a.deliveryBoyEarning}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={!!pickupModal} onClose={() => setPickupModal(null)} title="Verify Pickup Code">
        <div className="space-y-3">
          <p className="text-sm text-navy-900/60">
            Ask <span className="font-semibold text-navy-900">{pickupModal?.storeId?.storeName}</span> for the pickup code and enter it below.
          </p>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={4}
            placeholder="Enter pickup code"
            value={pickupInput}
            onChange={(e) => setPickupInput(e.target.value.replace(/\D/g, ''))}
            className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-3 text-center text-2xl font-bold tracking-[0.5em]"
          />
          {pickupError && <p className="text-xs text-coral text-center">{pickupError}</p>}
          <Button className="w-full" disabled={pickupInput.length !== 4 || busyId === pickupModal?.id} onClick={submitPickup}>
            {busyId === pickupModal?.id ? 'Verifying...' : 'Confirm Pickup'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!otpModal} onClose={() => setOtpModal(null)} title="Confirm Delivery">
        <div className="space-y-3">
          <p className="text-sm text-navy-900/60">
            Ask <span className="font-semibold text-navy-900">{otpModal?.orderId?.user?.name}</span> for the 4-digit code from their app, and enter it below to confirm this order reached them.
          </p>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={4}
            placeholder="Enter 4-digit OTP"
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
            className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-3 text-center text-2xl font-bold tracking-[0.5em]"
          />
          {otpError && <p className="text-xs text-coral text-center">{otpError}</p>}
          <Button className="w-full" disabled={otpInput.length !== 4 || busyId === otpModal?.id} onClick={submitDeliver}>
            {busyId === otpModal?.id ? 'Verifying...' : 'Confirm Delivery'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
