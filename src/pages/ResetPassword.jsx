import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck, Wand2, Eye, EyeOff } from 'lucide-react'
import Button from '../components/Button.jsx'
import { generatePassword } from '../utils/generatePassword.js'
import { api } from '../utils/api.js'
import { useToast } from '../context/ToastContext.jsx'

// Landing page for the link emailed by ForgotPassword.jsx — reads ?token=
// and &email= from the URL, submits the new password against them.
export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const email = params.get('email') || ''
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { showToast } = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.resetPassword({ email, token, newPassword })
      showToast('Password updated — log in with your new password')
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="max-w-sm mx-auto px-5 py-10 md:py-16 text-center">
        <p className="text-sm text-navy-900/50 mb-4">This reset link looks incomplete or invalid.</p>
        <Link to="/forgot-password" className="focus-ring text-teal-700 font-semibold text-sm">Request a new reset link</Link>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-10 md:py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white mx-auto mb-3">
          <ShieldCheck size={22} />
        </div>
        <h1 className="text-xl font-display font-bold">Set a new password</h1>
        <p className="text-sm text-navy-900/50">for {email}</p>
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <div className="relative">
          <input
            required
            type={showPassword ? 'text' : 'password'}
            minLength={6}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="focus-ring w-full border border-navy-900/15 rounded-lg pl-3.5 pr-9 py-2.5 text-sm"
          />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-navy-900/40" aria-label="Toggle password">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button type="button" onClick={() => { setNewPassword(generatePassword(12)); setShowPassword(true) }} className="focus-ring flex items-center gap-1.5 text-xs font-semibold text-teal-700">
          <Wand2 size={13} /> Generate secure password
        </button>
        {error && <p className="text-xs text-coral">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>

      <p className="text-center text-xs text-navy-900/50 mt-6">
        <Link to="/login" className="focus-ring text-teal-700 font-semibold">Back to login</Link>
      </p>
    </div>
  )
}
