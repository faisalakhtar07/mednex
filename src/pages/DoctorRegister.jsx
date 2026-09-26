import { useEffect, useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Button from '../components/Button.jsx'
import { api } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const SPECIALIZATIONS = ['General Physician', 'Dermatologist', 'Pediatrician', 'Gynecologist', 'Cardiologist', 'Dentist', 'Psychiatrist', 'Orthopedic', 'ENT Specialist']

const EMPTY = {
  name: '', qualification: '', specialization: '', experience: '', description: '',
  phone: '', clinicName: '', clinicAddress: '', city: '', state: '', pincode: '',
  consultationFee: '', availableTime: '',
}

export default function DoctorRegister() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'doctor') { setChecking(false); return }
    api.getMyDoctorProfile()
      .then(() => navigate('/doctor')) // already registered — go straight to dashboard
      .catch(() => setChecking(false))
  }, [isAuthenticated, user])

  if (!authLoading && (!isAuthenticated || user?.role !== 'doctor')) return <Navigate to="/staff/login" replace />
  if (checking || authLoading) return <div className="max-w-lg mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading...</div>

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.registerDoctorProfile({ ...form, consultationFee: Number(form.consultationFee) })
      showToast('Profile submitted — pending admin verification')
      navigate('/doctor')
    } catch (err) {
      setError(err.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 lg:px-6 py-8 md:py-12">
      <div className="text-center mb-7">
        <div className="w-12 h-12 rounded-xl bg-navy-950 flex items-center justify-center text-white mx-auto mb-3">
          <ShieldCheck size={22} />
        </div>
        <h1 className="text-xl font-display font-bold">Complete Your Doctor Profile</h1>
        <p className="text-sm text-navy-900/50">You'll go live once admin approves your profile and you activate a subscription plan.</p>
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <input required placeholder="Full Name (e.g. Dr. Ananya Sharma)" value={form.name} onChange={set('name')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <select required value={form.specialization} onChange={set('specialization')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm bg-white">
          <option value="">Specialization</option>
          {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Qualification (e.g. MBBS, MD)" value={form.qualification} onChange={set('qualification')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <input placeholder="Experience (e.g. 8 years)" value={form.experience} onChange={set('experience')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        </div>
        <textarea placeholder="Short description (optional)" rows={2} value={form.description} onChange={set('description')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <input required type="tel" placeholder="Clinic Contact Number" value={form.phone} onChange={set('phone')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <input placeholder="Clinic Name" value={form.clinicName} onChange={set('clinicName')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <input placeholder="Clinic Address" value={form.clinicAddress} onChange={set('clinicAddress')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <div className="grid grid-cols-3 gap-3">
          <input required placeholder="City" value={form.city} onChange={set('city')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <input placeholder="State" value={form.state} onChange={set('state')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <input placeholder="Pincode" value={form.pincode} onChange={set('pincode')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input required type="number" min="0" placeholder="Consultation Fee (₹)" value={form.consultationFee} onChange={set('consultationFee')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
          <input placeholder="Available Hours (e.g. 10 AM - 6 PM)" value={form.availableTime} onChange={set('availableTime')} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        </div>
        {error && <p className="text-xs text-coral">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving...' : 'Submit Profile'}</Button>
      </form>
      <p className="text-center text-xs text-navy-900/40 mt-5">
        <Link to="/" className="focus-ring hover:text-teal-700">← Back to MedNex</Link>
      </p>
    </div>
  )
}
