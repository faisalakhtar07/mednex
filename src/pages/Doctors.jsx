import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import DoctorCard from '../components/DoctorCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { ProductGridSkeleton } from '../components/Skeleton.jsx'
import { api } from '../utils/api.js'

const SPECIALIZATIONS = ['General Physician', 'Dermatologist', 'Pediatrician', 'Gynecologist', 'Cardiologist', 'Dentist', 'Psychiatrist', 'Orthopedic', 'ENT Specialist']

export default function Doctors() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = {}
    if (q) params.q = q
    if (specialization) params.specialization = specialization
    api.searchDoctors(params)
      .then(setDoctors)
      .catch(() => setError('Could not reach the backend. Make sure it is running.'))
      .finally(() => setLoading(false))
  }, [q, specialization])

  const runSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (q) params.q = q
    if (specialization) params.specialization = specialization
    setSearchParams(params)
  }

  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <h1 className="text-xl md:text-2xl font-display font-bold mb-1.5">Find a Doctor</h1>
      <p className="text-sm text-navy-900/50 mb-6">Search verified doctors by name or specialization.</p>

      <form onSubmit={runSearch} className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-900/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by doctor name or specialization"
            className="focus-ring w-full pl-10 pr-3.5 py-2.5 rounded-full bg-skyfaint border border-transparent focus:border-teal-500 focus:bg-white text-sm"
          />
        </div>
        <button type="submit" className="focus-ring shrink-0 text-sm font-semibold px-5 py-2.5 rounded-full bg-navy-950 text-white">Search</button>
      </form>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-navy-900/40 shrink-0"><SlidersHorizontal size={12} /> Filter:</span>
        <button
          onClick={() => setSpecialization('')}
          className={`focus-ring shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${!specialization ? 'bg-navy-950 text-white border-navy-950' : 'border-navy-900/15 text-navy-900/60'}`}
        >
          All
        </button>
        {SPECIALIZATIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSpecialization(s)}
            className={`focus-ring shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${specialization === s ? 'bg-navy-950 text-white border-navy-950' : 'border-navy-900/15 text-navy-900/60'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-4 text-sm text-amber-900/80 mb-6">{error}</div>}

      {loading ? (
        <ProductGridSkeleton />
      ) : doctors.length === 0 ? (
        <EmptyState icon="🩺" title="No doctors found" message="Try a different search term or specialization." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>
      )}
    </div>
  )
}
