import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Mail } from 'lucide-react'
import Button from '../components/Button.jsx'
import { api } from '../utils/api.js'

// Email-based reset: we send a one-time link (valid 15 min) instead of
// letting anyone with a mobile number reset the account directly — see
// mednex-backend/routes/authRoutes.js for why that changed.
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-10 md:py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white mx-auto mb-3">
          <ShieldCheck size={22} />
        </div>
        <h1 className="text-xl font-display font-bold">Reset your password</h1>
        <p className="text-sm text-navy-900/50">Enter your account email and we'll send you a reset link.</p>
      </div>

      {sent ? (
        <div className="bg-mint-500/10 text-mint-700 rounded-xl2 p-4 text-sm text-center">
          If an account exists for that email, a reset link has been sent — check your inbox (and spam folder). The link expires in 15 minutes.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-900/30" />
            <input
              required
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring w-full border border-navy-900/15 rounded-lg pl-10 pr-3.5 py-2.5 text-sm"
            />
          </div>
          {error && <p className="text-xs text-coral">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      )}

      <p className="text-center text-xs text-navy-900/50 mt-6">
        <Link to="/login" className="focus-ring text-teal-700 font-semibold">Back to login</Link>
      </p>
    </div>
  )
}
