import { useEffect, useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { Package, Clock, XCircle, Truck, IndianRupee, Users, LogOut, FileText, Store, KeyRound, X, Bike, Building2, UserPlus, Power } from 'lucide-react'
import { api } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const FILTERS = ['All', 'Pending', 'Confirmed', 'Rejected', 'Out for Delivery', 'Delivered', 'Cancelled']
const STATUS_COLOR = {
  Pending: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Rejected: 'bg-coral/10 text-coral',
  'Out for Delivery': 'bg-teal-100 text-teal-700',
  Delivered: 'bg-mint-500/10 text-mint-600',
  Cancelled: 'bg-navy-900/5 text-navy-900/40',
}

export default function OwnerDashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [store, setStore] = useState(null)
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [noStore, setNoStore] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  // The pickup code MedNex hands back only once, right when an order is
  // confirmed — the owner reads this out loud (or shows the screen) to
  // whichever rider arrives. It's never retrievable again after this.
  const [pickupCodeFor, setPickupCodeFor] = useState(null)

  // Delivery-mode choice, shown before an order actually confirms (spec
  // section 8: dual delivery system — the owner picks per order).
  const [confirmModalFor, setConfirmModalFor] = useState(null)
  const [deliveryMode, setDeliveryMode] = useState('mednex')
  const [selectedStaffId, setSelectedStaffId] = useState('')

  // The store's own delivery staff (separate from MedNex's platform fleet).
  const [deliveryStaff, setDeliveryStaff] = useState([])
  const [staffForm, setStaffForm] = useState({ name: '', email: '', mobile: '', password: '' })
  const [addingStaff, setAddingStaff] = useState(false)

  const loadOrders = () => {
    const params = filter === 'All' ? {} : { status: filter }
    api.ownerOrders(params).then(setOrders)
  }

  useEffect(() => {
    if (user?.role !== 'owner') return
    setLoading(true)
    Promise.all([api.getMyStore(), api.ownerStats(), api.ownerOrders(filter === 'All' ? {} : { status: filter }), api.ownerGetDeliveryStaff()])
      .then(([st, s, o, staff]) => {
        setStore(st)
        setStats(s)
        setOrders(o)
        setDeliveryStaff(staff)
      })
      .catch(() => setNoStore(true)) // owner has no store yet — attachStore returns 404
      .finally(() => setLoading(false))
  }, [user, filter])

  // Poll every 10s so new orders show up without a manual refresh.
  useEffect(() => {
    if (user?.role !== 'owner' || noStore) return
    const interval = setInterval(() => {
      api.ownerStats().then(setStats)
      loadOrders()
    }, 10000)
    return () => clearInterval(interval)
  }, [user, filter, noStore])

  if (!authLoading && !isAuthenticated) return <Navigate to="/staff/login" replace />
  if (!authLoading && user && user.role !== 'owner') return <Navigate to="/" replace />
  if (!loading && noStore) return <Navigate to="/owner/store/register" replace />
  if (authLoading || loading) return <div className="max-w-6xl mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading dashboard...</div>

  // The owner picks a delivery mode per order before confirming (spec
  // section 8). 'own' assigns one of the store's own riders directly and no
  // one else sees it; 'mednex' broadcasts to every online+approved platform
  // rider at once — first to accept gets it.
  const openConfirmModal = (orderId) => {
    setConfirmModalFor(orderId)
    const hasActiveStaff = deliveryStaff.some((s) => s.active)
    const preferred = store?.deliveryMode === 'own' && hasActiveStaff ? 'own' : store?.deliveryMode === 'mednex' ? 'mednex' : hasActiveStaff ? 'own' : 'mednex'
    setDeliveryMode(preferred)
    setSelectedStaffId(deliveryStaff.find((s) => s.active)?._id || '')
  }

  const submitConfirm = async () => {
    if (deliveryMode === 'own' && !selectedStaffId) return showToast('Select which of your riders will deliver this order')
    setBusyId(confirmModalFor)
    try {
      const result = await api.ownerConfirmOrder(confirmModalFor, { deliveryMode, deliveryBoyId: deliveryMode === 'own' ? selectedStaffId : undefined })
      showToast(
        deliveryMode === 'own'
          ? 'Order confirmed — assigned to your rider'
          : result.ridersNotified > 0
          ? `Order confirmed — broadcast to ${result.ridersNotified} online rider${result.ridersNotified === 1 ? '' : 's'}`
          : 'Order confirmed — no riders online yet, MedNex will assign one as soon as one comes online'
      )
      setPickupCodeFor({ orderId: confirmModalFor, code: result.pickupCode, deliveryMode, ridersNotified: result.ridersNotified })
      setConfirmModalFor(null)
      loadOrders()
    } catch (err) {
      showToast(err.message || 'Could not confirm order')
    } finally {
      setBusyId(null)
    }
  }

  const submitReject = async () => {
    if (!rejectReason.trim()) return showToast('Please enter a reason')
    setBusyId(rejectingId)
    try {
      await api.ownerRejectOrder(rejectingId, rejectReason.trim())
      showToast('Order rejected')
      setRejectingId(null)
      setRejectReason('')
      loadOrders()
    } catch (err) {
      showToast(err.message || 'Could not reject order')
    } finally {
      setBusyId(null)
    }
  }

  const addStaff = async (e) => {
    e.preventDefault()
    setAddingStaff(true)
    try {
      await api.ownerAddDeliveryStaff(staffForm)
      showToast('Delivery staff added')
      setStaffForm({ name: '', email: '', mobile: '', password: '' })
      const staff = await api.ownerGetDeliveryStaff()
      setDeliveryStaff(staff)
    } catch (err) {
      showToast(err.message || 'Could not add delivery staff')
    } finally {
      setAddingStaff(false)
    }
  }

  const toggleStaffActive = async (staffMember) => {
    try {
      await api.ownerSetStaffActive(staffMember._id, !staffMember.active)
      setDeliveryStaff((list) => list.map((s) => (s._id === staffMember._id ? { ...s, active: !s.active } : s)))
    } catch (err) {
      showToast(err.message || 'Could not update staff')
    }
  }

  const eligible = store?.verificationStatus === 'approved' && store?.subscriptionStatus === 'active' && store?.isOpen

  const statusBanner = (() => {
    if (!eligible) {
      if (store?.verificationStatus !== 'approved') {
        return { text: store?.verificationStatus === 'rejected' ? 'Store verification was rejected — check your store profile for details.' : 'Your store is awaiting Super Admin verification. It stays hidden from customers until approved.', color: 'bg-amber-50 border-amber-200 text-amber-800' }
      }
      if (store?.subscriptionStatus !== 'active') {
        return { text: 'No active subscription — your store is hidden from customer search.', color: 'bg-amber-50 border-amber-200 text-amber-800', cta: true }
      }
      if (!store?.isOpen) {
        return { text: "Your store is marked closed and won't appear in search. Toggle it open from your store profile.", color: 'bg-amber-50 border-amber-200 text-amber-800' }
      }
    }
    return { text: 'Your store is live and visible to customers searching your PIN code.', color: 'bg-mint-500/10 border-mint-500/20 text-mint-700' }
  })()

  const statCards = [
    { label: 'Pending', value: stats?.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Rejected', value: stats?.rejected, icon: XCircle, color: 'text-coral bg-coral/10' },
    { label: 'Out for Delivery', value: stats?.outForDelivery, icon: Truck, color: 'text-teal-600 bg-teal-50' },
    { label: 'Delivered', value: stats?.delivered, icon: Package, color: 'text-mint-600 bg-mint-500/10' },
    { label: 'Customers', value: stats?.customers, icon: Users, color: 'text-navy-900 bg-navy-900/5' },
    { label: 'Revenue', value: `₹${stats?.totalRevenue ?? 0}`, icon: IndianRupee, color: 'text-navy-900 bg-navy-900/5' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <div className="flex items-center justify-between mb-1.5">
        <h1 className="text-xl md:text-2xl font-display font-bold">Owner Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link to="/owner/store" className="focus-ring flex items-center gap-1.5 text-xs font-semibold text-navy-900/60">
            <Store size={14} /> Store Profile
          </Link>
          <Link to="/owner/prescriptions" className="focus-ring flex items-center gap-1.5 text-xs font-semibold text-teal-700">
            <FileText size={14} /> Prescriptions
          </Link>
          <button onClick={() => { logout(); navigate('/') }} className="focus-ring flex items-center gap-1.5 text-xs font-semibold text-coral">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
      <p className="text-sm text-navy-900/50 mb-4">Welcome back, {user?.name} · {store?.storeName}</p>

      <div className={`flex flex-wrap items-center justify-between gap-2 border rounded-xl2 px-4 py-3 mb-6 text-xs font-medium ${statusBanner.color}`}>
        <span>{statusBanner.text}</span>
        {statusBanner.cta && (
          <Link to="/owner/subscription" className="focus-ring shrink-0 text-xs font-semibold px-3 py-1 rounded-full bg-teal-600 text-white">
            Choose a plan →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-3.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c.color}`}>
              <c.icon size={15} />
            </div>
            <p className="text-lg font-bold">{c.value ?? 0}</p>
            <p className="text-[11px] text-navy-900/40">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-4">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`focus-ring shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
              filter === s ? 'bg-navy-950 text-white border-navy-950' : 'border-navy-900/15 text-navy-900/60'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-navy-900/40 py-10 text-center">No orders in this category.</p>
      ) : (
        <div className="space-y-3 mt-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-xl2 border border-navy-900/5 shadow-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-bold">{o.orderNumber}</p>
                  <p className="text-xs text-navy-900/50">{o.user?.name} · {o.user?.mobile}</p>
                  <p className="text-[11px] text-navy-900/40 mt-0.5">{o.address?.house}, {o.address?.area}, {o.address?.city}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>{o.status}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${o.paymentStatus === 'Paid' ? 'bg-mint-500/10 text-mint-600' : o.paymentStatus === 'Failed' ? 'bg-coral/10 text-coral' : 'bg-navy-900/5 text-navy-900/40'}`}>
                    {o.paymentStatus} · {o.paymentMethod?.toUpperCase()}
                  </span>
                </div>
              </div>

              {o.status === 'Rejected' && o.rejectionReason && (
                <p className="text-xs text-coral bg-coral/5 rounded-lg px-3 py-2 mb-3">Rejected: {o.rejectionReason}</p>
              )}

              <div className="text-xs text-navy-900/60 space-y-0.5 mb-3">
                {o.items?.map((i) => (
                  <div key={i.name} className="flex justify-between">
                    <span>{i.name} × {i.qty}</span>
                    <span>₹{i.price * i.qty}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm font-bold mb-3 pt-2 border-t border-navy-900/5">
                <span>Total</span>
                <span>₹{o.total}</span>
              </div>

              {o.status === 'Pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openConfirmModal(o.id)}
                    disabled={busyId === o.id}
                    className="focus-ring flex-1 text-xs font-semibold px-4 py-2 rounded-lg bg-navy-950 text-white disabled:opacity-50"
                  >
                    Confirm order
                  </button>
                  <button
                    onClick={() => { setRejectingId(o.id); setRejectReason('') }}
                    disabled={busyId === o.id}
                    className="focus-ring flex-1 text-xs font-semibold px-4 py-2 rounded-lg border border-coral/30 text-coral disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
              {o.status !== 'Pending' && o.status !== 'Rejected' && (
                <p className="text-[11px] text-navy-900/40 flex items-center gap-1">
                  {o.deliveryMode === 'own' ? <><Building2 size={11} /> Your own delivery team is handling this order.</> : <><Bike size={11} /> MedNex delivery is handling this order — nothing more for you to do here.</>}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delivery-mode choice modal — shown before every confirm */}
      {confirmModalFor && (
        <div className="fixed inset-0 bg-navy-950/40 flex items-center justify-center z-50 px-5" onClick={() => setConfirmModalFor(null)}>
          <div className="bg-white rounded-xl2 p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-display font-bold">Confirm order</h3>
              <button onClick={() => setConfirmModalFor(null)} className="focus-ring text-navy-900/40"><X size={16} /></button>
            </div>
            <p className="text-xs text-navy-900/50 mb-4">Who will deliver this order?</p>

            <div className="space-y-2 mb-4">
              <label className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer ${deliveryMode === 'own' ? 'border-teal-600 bg-teal-50/50' : 'border-navy-900/10'}`}>
                <input type="radio" name="deliveryMode" checked={deliveryMode === 'own'} onChange={() => setDeliveryMode('own')} className="accent-teal-600 w-4 h-4" />
                <Building2 size={16} className="text-navy-900/60" />
                <div className="flex-1">
                  <p className="text-xs font-semibold">Own Delivery</p>
                  <p className="text-[11px] text-navy-900/40">Assign one of your own riders directly</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer ${deliveryMode === 'mednex' ? 'border-teal-600 bg-teal-50/50' : 'border-navy-900/10'}`}>
                <input type="radio" name="deliveryMode" checked={deliveryMode === 'mednex'} onChange={() => setDeliveryMode('mednex')} className="accent-teal-600 w-4 h-4" />
                <Bike size={16} className="text-navy-900/60" />
                <div className="flex-1">
                  <p className="text-xs font-semibold">MedNex Delivery</p>
                  <p className="text-[11px] text-navy-900/40">Broadcast to every online MedNex rider — first to accept gets it</p>
                </div>
              </label>
            </div>

            {deliveryMode === 'own' && (
              deliveryStaff.filter((s) => s.active).length === 0 ? (
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                  You have no active delivery staff yet — add one below, or choose MedNex Delivery instead.
                </p>
              ) : (
                <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3 py-2 text-xs mb-4">
                  {deliveryStaff.filter((s) => s.active).map((s) => (
                    <option key={s._id} value={s._id}>{s.name} · {s.mobile}</option>
                  ))}
                </select>
              )
            )}

            <button
              onClick={submitConfirm}
              disabled={busyId === confirmModalFor || (deliveryMode === 'own' && deliveryStaff.filter((s) => s.active).length === 0)}
              className="focus-ring w-full text-xs font-semibold px-4 py-2.5 rounded-lg bg-navy-950 text-white disabled:opacity-50"
            >
              {busyId === confirmModalFor ? 'Confirming...' : 'Confirm order'}
            </button>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-navy-950/40 flex items-center justify-center z-50 px-5" onClick={() => setRejectingId(null)}>
          <div className="bg-white rounded-xl2 p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-display font-bold">Reject order</h3>
              <button onClick={() => setRejectingId(null)} className="focus-ring text-navy-900/40"><X size={16} /></button>
            </div>
            <textarea
              autoFocus
              placeholder="e.g. Paracetamol 500mg out of stock"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="focus-ring w-full border border-navy-900/15 rounded-lg px-3 py-2 text-sm mb-3"
            />
            <button
              onClick={submitReject}
              disabled={busyId === rejectingId}
              className="focus-ring w-full text-xs font-semibold px-4 py-2 rounded-lg bg-coral text-white disabled:opacity-50"
            >
              {busyId === rejectingId ? 'Rejecting...' : 'Confirm rejection'}
            </button>
          </div>
        </div>
      )}

      {/* Pickup code modal */}
      {pickupCodeFor && (
        <div className="fixed inset-0 bg-navy-950/40 flex items-center justify-center z-50 px-5" onClick={() => setPickupCodeFor(null)}>
          <div className="bg-white rounded-xl2 p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <KeyRound size={28} className="mx-auto text-teal-600 mb-2" />
            <h3 className="text-sm font-display font-bold mb-1">Pickup code</h3>
            <p className="text-[11px] text-navy-900/50 mb-4">
              {pickupCodeFor.deliveryMode === 'own'
                ? 'Read this code to your rider when they arrive to collect the order.'
                : pickupCodeFor.ridersNotified > 0
                ? 'Read this code to whichever MedNex rider arrives to collect the order — first to accept the broadcast gets it.'
                : 'No riders are online right now — MedNex will assign one as soon as one comes online. Keep this code ready for when they arrive.'}
            </p>
            <p className="text-3xl font-display font-extrabold tracking-[0.3em] text-navy-950 mb-4">{pickupCodeFor.code}</p>
            <p className="text-[10px] text-navy-900/40 mb-4">This code is shown only once and cannot be retrieved again — write it down if the rider hasn't arrived yet.</p>
            <button onClick={() => setPickupCodeFor(null)} className="focus-ring w-full text-xs font-semibold px-4 py-2 rounded-lg bg-navy-950 text-white">Got it</button>
          </div>
        </div>
      )}

      {/* Own delivery staff management (spec section 8: "Owner Delivery") —
          accounts created here are auto-approved (owner vouches for them,
          not Super Admin) and only ever receive orders this owner assigns
          them to directly — they never enter MedNex's broadcast pool. */}
      <div className="mt-10 pt-6 border-t border-navy-900/10">
        <h2 className="text-lg font-display font-bold mb-1 flex items-center gap-2">
          <UserPlus size={17} /> Your Delivery Staff
        </h2>
        <p className="text-xs text-navy-900/50 mb-4">Riders added here deliver only orders you assign directly to them — choose "Own Delivery" when confirming an order to use them.</p>

        <form onSubmit={addStaff} className="flex flex-wrap gap-2 mb-5">
          <input required placeholder="Name" value={staffForm.name} onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))} className="focus-ring flex-1 min-w-[140px] border border-navy-900/15 rounded-lg px-3 py-2 text-xs" />
          <input type="email" placeholder="Email (optional)" value={staffForm.email} onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))} className="focus-ring flex-1 min-w-[160px] border border-navy-900/15 rounded-lg px-3 py-2 text-xs" />
          <input required type="tel" placeholder="Mobile" value={staffForm.mobile} onChange={(e) => setStaffForm((f) => ({ ...f, mobile: e.target.value }))} className="focus-ring flex-1 min-w-[120px] border border-navy-900/15 rounded-lg px-3 py-2 text-xs" />
          <input required type="password" minLength={6} placeholder="Password" value={staffForm.password} onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))} className="focus-ring flex-1 min-w-[120px] border border-navy-900/15 rounded-lg px-3 py-2 text-xs" />
          <button type="submit" disabled={addingStaff} className="focus-ring shrink-0 text-xs font-semibold px-4 py-2 rounded-lg bg-navy-950 text-white disabled:opacity-50">
            {addingStaff ? 'Adding...' : 'Add Staff'}
          </button>
        </form>

        {deliveryStaff.length === 0 ? (
          <p className="text-xs text-navy-900/40">No delivery staff yet — add one above, or use MedNex Delivery for now.</p>
        ) : (
          <div className="space-y-2">
            {deliveryStaff.map((s) => (
              <div key={s._id} className="flex items-center justify-between bg-white rounded-xl border border-navy-900/5 shadow-card px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-navy-900/40">{s.mobile}{s.email ? ` · ${s.email}` : ''}</p>
                </div>
                <button
                  onClick={() => toggleStaffActive(s)}
                  className={`focus-ring flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${s.active ? 'bg-mint-500/10 text-mint-600' : 'bg-navy-900/5 text-navy-900/40'}`}
                >
                  <Power size={12} /> {s.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
