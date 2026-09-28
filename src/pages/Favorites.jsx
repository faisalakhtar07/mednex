import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import DoctorCard from '../components/DoctorCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { api } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Favorites() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  // Re-fetch whenever the user's favorite list changes (heart toggled from a
  // card here → refreshUser() updates user.favoriteDoctors → this reloads).
  useEffect(() => {
    if (!isAuthenticated) return
    api.myFavoriteDoctors().then(setDoctors).finally(() => setLoading(false))
  }, [isAuthenticated, user?.favoriteDoctors?.length])

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />
  if (loading || authLoading) return <div className="max-w-2xl mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <h1 className="text-xl md:text-2xl font-display font-bold mb-6">Saved Doctors</h1>
      {doctors.length === 0 ? (
        <EmptyState icon="❤️" title="No saved doctors yet" message="Tap the heart on any doctor to save them here for quick booking." ctaLabel="Find a Doctor" ctaTo="/doctors" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>
      )}
    </div>
  )
}
