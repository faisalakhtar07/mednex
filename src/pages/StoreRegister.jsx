import { useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { Store, ChevronLeft } from 'lucide-react'
import Button from '../components/Button.jsx'
import { INDIAN_STATES_AND_UTS } from '../data/locations.js'
import { api } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const initialForm = {
  storeName: '',
  pharmacistName: '',
  phone: '',
  email: '',
  address: '',
  state: '',
  district: '',
  city: '',
  area: '',
  pinCode: '',
  drugLicenseNumber: '',
  gstNumber: '',
  openingTime: '09:00',
  closingTime: '21:00',
}

export default function StoreRegister() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!authLoading && !isAuthenticated) return <Navigate to="/staff/login" replace />
  if (!authLoading && user && user.role !== 'owner') return <Navigate to="/" replace />

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(form.pinCode.trim())) {
      setError('Enter a valid 6-digit PIN code')
      return
    }
    setLoading(true)
    try {
      await api.registerStore({
        storeName: form.storeName.trim(),
        pharmacistName: form.pharmacistName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        address: form.address.trim(),
        state: form.state,
        district: form.district.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        pinCode: form.pinCode.trim(),
        licenseDetails: { drugLicenseNumber: form.drugLicenseNumber.trim() },
        gstDetails: { gstNumber: form.gstNumber.trim() },
        openingTime: form.openingTime,
        closingTime: form.closingTime,
      })
      showToast('Store registered — choose a subscription plan to go live')
      navigate('/owner/subscription')
    } catch (err) {
      setError(err.message || 'Could not register store')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <div className="max-w-lg mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading...</div>

  return (
    <div className="max-w-lg mx-auto px-5 lg:px-6 py-6 md:py-10">
      <Link to="/owner" className="focus-ring inline-flex items-center gap-1 text-xs text-navy-900/50 mb-4">
        <ChevronLeft size={14} /> Back to dashboard
      </Link>

      <div className="mb-6">
        <div className="w-11 h-11 rounded-xl bg-navy-950 flex items-center justify-center text-white mb-3">
          <Store size={20} />
        </div>
        <h1 className="text-xl md:text-2xl font-display font-bold mb-1">Register Your Medical Store</h1>
        <p className="text-sm text-navy-900/50">
          Your store stays hidden from customers until it's verified and an active subscription is in place. You can edit these details anytime from your dashboard.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
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
          <h2 className="text-xs font-bold uppercase tracking-wide text-navy-900/40">Compliance</h2>
          <input placeholder="Drug License Number" value={form.drugLicenseNumber} onChange={set('drugLicenseNumber')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <input placeholder="GST Number (if applicable)" value={form.gstNumber} onChange={set('gstNumber')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-navy-900/40">Hours</h2>
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
        </section>

        {error && <p className="text-xs text-coral">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Registering...' : 'Register Store'}
        </Button>
      </form>
    </div>
  )
}
