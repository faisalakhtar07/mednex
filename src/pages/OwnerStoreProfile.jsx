import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { ChevronLeft, Store, QrCode, Upload, CheckCircle2 } from 'lucide-react'
import Button from '../components/Button.jsx'
import { INDIAN_STATES_AND_UTS } from '../data/locations.js'
import { api } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const VERIFICATION_LABEL = {
  pending: { text: 'Verification pending', color: 'bg-amber-100 text-amber-700' },
  approved: { text: 'Verified', color: 'bg-mint-500/10 text-mint-600' },
  rejected: { text: 'Verification rejected', color: 'bg-coral/10 text-coral' },
}
const SUBSCRIPTION_LABEL = {
  pending: { text: 'No active subscription', color: 'bg-amber-100 text-amber-700' },
  active: { text: 'Subscription active', color: 'bg-mint-500/10 text-mint-600' },
  expired: { text: 'Subscription expired', color: 'bg-coral/10 text-coral' },
  cancelled: { text: 'Subscription cancelled', color: 'bg-coral/10 text-coral' },
}

export default function OwnerStoreProfile() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [store, setStore] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [uploadingQr, setUploadingQr] = useState(false)

  useEffect(() => {
    if (user?.role !== 'owner') return
    api
      .getMyStore()
      .then((s) => {
        setStore(s)
        setForm({
          storeName: s.storeName || '', pharmacistName: s.pharmacistName || '', phone: s.phone || '', email: s.email || '',
          address: s.address || '', state: s.state || '', district: s.district || '', city: s.city || '', area: s.area || '',
          pinCode: s.pinCode || '', openingTime: s.openingTime || '09:00', closingTime: s.closingTime || '21:00', isOpen: s.isOpen,
          deliveryMode: s.deliveryMode || 'mednex',
        })
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [user])

  if (!authLoading && !isAuthenticated) return <Navigate to="/staff/login" replace />
  if (!authLoading && user && user.role !== 'owner') return <Navigate to="/" replace />
  if (!loading && notFound) return <Navigate to="/owner/store/register" replace />
  if (authLoading || loading || !form) return <div className="max-w-lg mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading store profile...</div>

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await api.updateMyStore(form)
      setStore(updated)
      showToast('Store profile updated')
    } catch (err) {
      showToast(err.message || 'Could not update store')
    } finally {
      setSaving(false)
    }
  }

  const uploadQrCode = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingQr(true)
    try {
      const updated = await api.uploadStoreQrCode(file)
      setStore(updated)
      showToast('Payout QR code uploaded — MedNex will use this to pay your settlements')
    } catch (err) {
      showToast(err.message || 'Could not upload QR code')
    } finally {
      setUploadingQr(false)
      e.target.value = ''
    }
  }

  const verification = VERIFICATION_LABEL[store.verificationStatus]
  const subscription = SUBSCRIPTION_LABEL[store.subscriptionStatus]

  return (
    <div className="max-w-lg mx-auto px-5 lg:px-6 py-6 md:py-10">
      <Link to="/owner" className="focus-ring inline-flex items-center gap-1 text-xs text-navy-900/50 mb-4">
        <ChevronLeft size={14} /> Back to dashboard
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-xl bg-navy-950 flex items-center justify-center text-white shrink-0">
          <Store size={20} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold">{store.storeName}</h1>
          <p className="text-xs text-navy-900/40">{store.pinCode} · {store.city}, {store.state}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${verification.color}`}>{verification.text}</span>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${subscription.color}`}>{subscription.text}</span>
        {store.subscriptionStatus !== 'active' && (
          <Link to="/owner/subscription" className="focus-ring text-[11px] font-semibold px-2.5 py-1 rounded-full bg-teal-600 text-white">
            Manage subscription →
          </Link>
        )}
      </div>
      {store.verificationStatus === 'rejected' && store.verificationNote && (
        <p className="text-xs text-coral bg-coral/5 border border-coral/20 rounded-lg px-3.5 py-2.5 mb-6">{store.verificationNote}</p>
      )}
      {(store.verificationStatus !== 'approved' || store.subscriptionStatus !== 'active') && (
        <p className="text-xs text-navy-900/50 bg-skyfaint rounded-lg px-3.5 py-2.5 mb-6">
          Your store won't appear in customer PIN-code search results until it's verified and your subscription is active.
        </p>
      )}

      <form onSubmit={save} className="space-y-5">
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-navy-900/40">Store Identity</h2>
          <input required placeholder="Medical Store Name" value={form.storeName} onChange={set('storeName')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <input placeholder="Pharmacist Name" value={form.pharmacistName} onChange={set('pharmacistName')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="tel" placeholder="Store Phone" value={form.phone} onChange={set('phone')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
            <input required type="email" placeholder="Store Email" value={form.email} onChange={set('email')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-navy-900/40">Location</h2>
          <input placeholder="Full Address" value={form.address} onChange={set('address')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select required value={form.state} onChange={set('state')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm bg-white">
              <option value="" disabled>State / UT</option>
              {INDIAN_STATES_AND_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input required placeholder="District" value={form.district} onChange={set('district')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="City" value={form.city} onChange={set('city')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
            <input placeholder="Area" value={form.area} onChange={set('area')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          </div>
          <input required placeholder="PIN Code" inputMode="numeric" maxLength={6} value={form.pinCode} onChange={set('pinCode')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-navy-900/40">Hours & Status</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-navy-900/50">
              Opening
              <input type="time" value={form.openingTime} onChange={set('openingTime')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm mt-1" />
            </label>
            <label className="text-xs text-navy-900/50">
              Closing
              <input type="time" value={form.closingTime} onChange={set('closingTime')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm mt-1" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.isOpen} onChange={(e) => setForm((f) => ({ ...f, isOpen: e.target.checked }))} className="focus-ring w-4 h-4" />
            Store is currently open for orders
          </label>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-navy-900/40 mb-3">Default Delivery Mode</h2>
          <p className="text-[11px] text-navy-900/40 mb-3">You can still override this per order when confirming — this is just what's pre-selected. Manage your own riders from the dashboard.</p>
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex flex-col items-center gap-1 border rounded-xl p-3 cursor-pointer text-center ${form.deliveryMode === 'own' ? 'border-teal-600 bg-teal-50/50' : 'border-navy-900/10'}`}>
              <input type="radio" name="deliveryMode" checked={form.deliveryMode === 'own'} onChange={() => setForm((f) => ({ ...f, deliveryMode: 'own' }))} className="sr-only" />
              <span className="text-xs font-semibold">Own Delivery</span>
              <span className="text-[10px] text-navy-900/40">Your own riders</span>
            </label>
            <label className={`flex flex-col items-center gap-1 border rounded-xl p-3 cursor-pointer text-center ${form.deliveryMode === 'mednex' ? 'border-teal-600 bg-teal-50/50' : 'border-navy-900/10'}`}>
              <input type="radio" name="deliveryMode" checked={form.deliveryMode === 'mednex'} onChange={() => setForm((f) => ({ ...f, deliveryMode: 'mednex' }))} className="sr-only" />
              <span className="text-xs font-semibold">MedNex Delivery</span>
              <span className="text-[10px] text-navy-900/40">Platform-wide riders</span>
            </label>
          </div>
        </section>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>

      {/* Payout QR code — only meaningful once a subscription is active,
          since that's the point MedNex actually starts owing this store
          settlement money (spec: subscribe first, then upload QR so admin
          can pay settlements by scanning it). */}
      {store.subscriptionStatus === 'active' && (
        <section className="mt-8 pt-6 border-t border-navy-900/10">
          <h2 className="text-xs font-bold uppercase tracking-wide text-navy-900/40 mb-3 flex items-center gap-1.5">
            <QrCode size={13} /> Payout QR Code
          </h2>
          <p className="text-xs text-navy-900/50 mb-4">
            Upload your UPI QR code — MedNex Admin scans this to pay you your settlement amount after each order. Never shown to customers.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl border border-navy-900/10 bg-skyfaint flex items-center justify-center overflow-hidden shrink-0">
              {store.qrCodeUrl ? <img src={store.qrCodeUrl} alt="Payout QR code" className="w-full h-full object-cover" /> : <QrCode size={28} className="text-navy-900/20" />}
            </div>
            <div>
              {store.qrCodeUrl && (
                <p className="flex items-center gap-1 text-xs font-semibold text-mint-600 mb-2">
                  <CheckCircle2 size={13} /> QR code on file
                </p>
              )}
              <label className="focus-ring inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-navy-900/15 cursor-pointer">
                <Upload size={13} /> {uploadingQr ? 'Uploading...' : store.qrCodeUrl ? 'Replace QR code' : 'Upload QR code'}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingQr} onChange={uploadQrCode} />
              </label>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
