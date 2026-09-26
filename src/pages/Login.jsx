import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Cross, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import Button from '../components/Button.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// Mobile number + password only — OTP has been removed entirely from the
// app (product decision), so there's no OTP tab here anymore.
export default function Login() {
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { login } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(mobile.trim(), password)
      showToast('Logged in successfully')
      // Admin accounts don't get a dashboard in this app at all — MedNex
      // Company Admin is a completely separate, private application. If an
      // admin account somehow logs in here, just send them to the ordinary
      // profile page rather than a broken /admin link.
      navigate('/profile')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-10 md:py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white mx-auto mb-3">
          <Cross size={22} />
        </div>
        <h1 className="text-xl font-display font-bold">Welcome back</h1>
        <p className="text-sm text-navy-900/50">Login to manage your orders and prescriptions.</p>
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-900/30" />
          <input
            required
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
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
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-navy-900/40 hover:text-navy-900/70"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && <p className="text-xs text-coral">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
        <p className="text-center">
          <Link to="/forgot-password" className="focus-ring text-xs font-semibold text-teal-700">Forgot password?</Link>
        </p>
      </form>

      <p className="text-center text-xs text-navy-900/50 mt-6">
        New here? <Link to="/signup" className="focus-ring text-teal-700 font-semibold">Create an account</Link>
      </p>
    </div>
  )
}
