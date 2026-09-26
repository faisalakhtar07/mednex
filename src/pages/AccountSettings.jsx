import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ChevronLeft, Wand2, Eye, EyeOff, Copy } from 'lucide-react'
import Button from '../components/Button.jsx'
import { generatePassword } from '../utils/generatePassword.js'
import { api } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

export default function AccountSettings() {
  const { user, loading, isAuthenticated, refreshUser } = useAuth()
  const { showToast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  if (loading) return <div className="max-w-lg mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await api.updateProfile({ name, email: email.trim() || undefined })
      await refreshUser()
      showToast('Profile updated')
      setEmail('')
    } catch (err) {
      showToast(err.message || 'Could not update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setSavingPassword(true)
    try {
      await api.setPassword(newPassword, currentPassword)
      await refreshUser()
      showToast('Password updated')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      showToast(err.message || 'Could not update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const fillGenerated = () => {
    setNewPassword(generatePassword(12))
    setShowPassword(true)
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(newPassword)
      showToast('Password copied')
    } catch {
      showToast('Could not copy — select and copy manually')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 lg:px-6 py-6 md:py-10">
      <Link to="/profile" className="focus-ring inline-flex items-center gap-1 text-xs text-navy-900/50 mb-4">
        <ChevronLeft size={14} /> Back to profile
      </Link>
      <h1 className="text-xl md:text-2xl font-display font-bold mb-6">Account Settings</h1>

      <form onSubmit={saveProfile} className="space-y-3 mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wide text-navy-900/40">Profile</h2>
        <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        {!user?.email && (
          <input type="email" placeholder="Add an email address (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        )}
        {user?.mobile && <p className="text-xs text-navy-900/40">Mobile: +91 {user.mobile}</p>}
        {user?.email && <p className="text-xs text-navy-900/40">Email: {user.email}</p>}
        <Button type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</Button>
      </form>

      <form onSubmit={savePassword} className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-navy-900/40">Change Password</h2>
        <input required type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm" />
        <div className="relative">
          <input
            required
            type={showPassword ? 'text' : 'password'}
            minLength={6}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="focus-ring w-full border border-navy-900/15 rounded-lg pl-3.5 pr-20 py-2.5 text-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {newPassword && (
              <button type="button" onClick={copyPassword} className="focus-ring p-1.5 text-navy-900/40 hover:text-navy-900/70" aria-label="Copy password">
                <Copy size={14} />
              </button>
            )}
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="focus-ring p-1.5 text-navy-900/40 hover:text-navy-900/70" aria-label="Toggle password">
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <button type="button" onClick={fillGenerated} className="focus-ring flex items-center gap-1.5 text-xs font-semibold text-teal-700">
          <Wand2 size={13} /> Generate secure password
        </button>
        <Button type="submit" disabled={savingPassword}>{savingPassword ? 'Saving...' : 'Save Password'}</Button>
      </form>
    </div>
  )
}
