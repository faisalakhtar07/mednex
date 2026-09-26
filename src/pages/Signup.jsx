import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Cross, Eye, EyeOff, Wand2, Copy } from 'lucide-react'
import Button from '../components/Button.jsx'
import { generatePassword } from '../utils/generatePassword.js'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// Mobile number + a self-created password only — OTP has been removed
// entirely from the app (product decision). "Generate Password" is a
// one-click helper that meets the spec's policy (min 8 chars, upper/lower/
// number/special) without a network round trip.
export default function Signup() {
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '' })
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { register } = useAuth()

  const fillGeneratedPassword = () => {
    const generated = generatePassword(12)
    setForm((f) => ({ ...f, password: generated }))
    setShowPassword(true)
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(form.password)
      showToast('Password copied')
    } catch {
      showToast('Could not copy — select and copy manually')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!agreed) return
    setError('')
    setLoading(true)
    try {
      await register({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() ? form.email.trim().toLowerCase() : undefined,
        password: form.password,
      })
      showToast('Account created successfully')
      navigate('/profile')
    } catch (err) {
      setError(err.message || 'Signup failed')
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
        <h1 className="text-xl font-display font-bold">Create your account</h1>
        <p className="text-sm text-navy-900/50">Join MedNex for faster appointment booking and tracking.</p>
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <input required placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <input required type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <input type="email" placeholder="Email Address (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />

        <div className="relative">
          <input
            required
            type={showPassword ? 'text' : 'password'}
            minLength={6}
            placeholder="Password (min 8 characters)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="focus-ring w-full border border-navy-900/15 rounded-lg pl-3.5 pr-20 py-2.5 text-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {form.password && (
              <button type="button" onClick={copyPassword} className="focus-ring p-1.5 text-navy-900/40 hover:text-navy-900/70" aria-label="Copy password">
                <Copy size={14} />
              </button>
            )}
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="focus-ring p-1.5 text-navy-900/40 hover:text-navy-900/70" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <button type="button" onClick={fillGeneratedPassword} className="focus-ring flex items-center gap-1.5 text-xs font-semibold text-teal-700">
          <Wand2 size={13} /> Generate secure password
        </button>

        <label className="flex items-start gap-2 text-xs text-navy-900/60">
          <input required type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-teal-600 w-4 h-4 mt-0.5" />
          I agree to the <Link to="/terms" className="text-teal-700 font-medium">Terms & Conditions</Link> and <Link to="/privacy" className="text-teal-700 font-medium">Privacy Policy</Link>
        </label>

        {error && <p className="text-xs text-coral">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-xs text-navy-900/50 mt-6">
        Already have an account? <Link to="/login" className="focus-ring text-teal-700 font-semibold">Login</Link>
      </p>
    </div>
  )
}
