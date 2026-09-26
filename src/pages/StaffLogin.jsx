import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Stethoscope, Users } from 'lucide-react'
import Button from '../components/Button.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// NOTE: this used to be the Owner/Delivery login — both roles removed along
// with the medical-store marketplace. Doctor and Doctor Staff login the
// same way now.
export default function StaffLogin() {
  const [role, setRole] = useState('doctor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { staffLogin } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await staffLogin({ email: email.trim().toLowerCase(), password, role })
      showToast(`Welcome back, ${data.name}`)
      navigate('/doctor')
    } catch (err) {
      setError(err.message || 'Login failed')
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
        <h1 className="text-xl font-display font-bold">Doctor / Staff Login</h1>
        <p className="text-sm text-navy-900/50">Secure staff access — not for patient accounts.</p>
      </div>

      <div className="flex bg-skyfaint rounded-full p-1 mb-6">
        <button
          type="button"
          onClick={() => setRole('doctor')}
          className={`focus-ring flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-full ${role === 'doctor' ? 'bg-white shadow-sm text-navy-900' : 'text-navy-900/50'}`}
        >
          <Stethoscope size={13} /> Doctor
        </button>
        <button
          type="button"
          onClick={() => setRole('doctor_staff')}
          className={`focus-ring flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-full ${role === 'doctor_staff' ? 'bg-white shadow-sm text-navy-900' : 'text-navy-900/50'}`}
        >
          <Users size={13} /> Staff
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-900/30" />
          <input
            required
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring w-full border border-navy-900/15 rounded-lg pl-10 pr-3.5 py-2.5 text-sm"
          />
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-900/30" />
          <input
            required
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-ring w-full border border-navy-900/15 rounded-lg pl-10 pr-10 py-2.5 text-sm"
          />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-navy-900/40" aria-label="Toggle password">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <p className="text-xs text-coral">{error}</p>}
        <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
          {loading ? 'Verifying...' : `Login as ${role === 'doctor' ? 'Doctor' : 'Staff'}`}
        </Button>
      </form>

      {role === 'doctor' ? (
        <p className="text-center text-xs text-navy-900/50 mt-6">
          New doctor? <Link to="/staff/register" className="focus-ring text-teal-700 font-semibold">Register on MedNex</Link>
        </p>
      ) : (
        <p className="text-center text-xs text-navy-900/50 mt-6">
          Staff accounts are created by your doctor from their dashboard — not self-service.
        </p>
      )}
      <p className="text-center text-xs text-navy-900/40 mt-4">
        <Link to="/login" className="focus-ring hover:text-teal-700">← Back to patient login</Link>
      </p>
    </div>
  )
}
