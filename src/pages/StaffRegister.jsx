import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import Button from '../components/Button.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// NOTE: this used to register BOTH medical store owners and delivery
// riders — both removed along with that business. Only doctors self-register
// now (doctor_staff accounts are created by a doctor from their dashboard,
// not self-service — see the backend's POST /api/staff/add).
export default function StaffRegister() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { staffRegister } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await staffRegister({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password,
        role: 'doctor',
      })
      showToast('Doctor account created — complete your profile next')
      navigate('/doctor/register')
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-10 md:py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-navy-950 flex items-center justify-center text-white mx-auto mb-3">
          <ShieldCheck size={22} />
        </div>
        <h1 className="text-xl font-display font-bold">Register as a Doctor</h1>
        <p className="text-sm text-navy-900/50">Sign up free — you'll set up your profile and subscription next.</p>
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <input required placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <input required type="tel" placeholder="Mobile Number" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <input required type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <div className="relative">
          <input
            required
            type={showPassword ? 'text' : 'password'}
            minLength={6}
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 pr-10 text-sm"
          />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-navy-900/40" aria-label="Toggle password">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && <p className="text-xs text-coral">{error}</p>}
        <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Doctor Account'}
        </Button>
      </form>

      <p className="text-center text-xs text-navy-900/50 mt-6">
        Already registered? <Link to="/staff/login" className="focus-ring text-teal-700 font-semibold">Login</Link>
      </p>
    </div>
  )
}
