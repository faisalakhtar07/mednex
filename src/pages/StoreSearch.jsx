import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapPin, Star, Truck, Clock } from 'lucide-react'
import StorePicker from '../components/StorePicker.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { ProductGridSkeleton } from '../components/Skeleton.jsx'
import { api } from '../utils/api.js'
import { useStore } from '../context/StoreContext.jsx'

// spec section 3: enter PIN -> validate -> search eligible stores at that
// location -> display in a marketplace UI. Eligibility (verification +
// active subscription + open) is entirely enforced server-side by
// MedicalStore.marketplaceEligibleFilter — this page just renders whatever
// the API returns.
export default function StoreSearch() {
  const [params] = useSearchParams()
  const pin = params.get('pin') || ''
  const navigate = useNavigate()
  const { selectStore } = useStore()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (pin.length !== 6) return
    setLoading(true)
    setError('')
    api
      .searchStores({ pinCode: pin })
      .then(setStores)
      .catch((err) => setError(err.message || 'Could not search stores right now.'))
      .finally(() => setLoading(false))
  }, [pin])

  const pick = (store) => {
    selectStore(store)
    navigate(`/store/${store.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <h1 className="text-xl md:text-2xl font-display font-bold mb-1">Medical Stores {pin && `near ${pin}`}</h1>
      <p className="text-sm text-navy-900/50 mb-5">Pick a store to start browsing its medicines.</p>

      <StorePicker />

      <div className="mt-6">
        {pin.length !== 6 ? (
          <p className="text-sm text-navy-900/40 py-8 text-center">Enter a 6-digit PIN code above to find nearby stores.</p>
        ) : loading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-4 text-sm text-amber-900/80">{error}</div>
        ) : stores.length === 0 ? (
          <EmptyState icon="🏪" title="No stores found here yet" message="MedNex is expanding — try a nearby PIN code or check back soon." />
        ) : (
          <div className="space-y-3">
            {stores.map((s) => (
              <button
                key={s.id}
                onClick={() => pick(s)}
                className="focus-ring w-full text-left bg-white rounded-xl2 border border-navy-900/5 shadow-card hover:shadow-cardHover p-4 flex items-center gap-4 transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {s.logo ? <img src={s.logo} alt="" className="w-full h-full object-cover" /> : '🏪'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{s.storeName}</p>
                  <p className="flex items-center gap-1 text-xs text-navy-900/50 mt-0.5">
                    <MapPin size={11} /> {s.city}, {s.state}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {s.ratingAvg > 0 && (
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
                        <Star size={11} className="fill-amber-500 text-amber-500" /> {s.ratingAvg.toFixed(1)}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[11px] text-navy-900/40"><Truck size={11} /> Delivery available</span>
                    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${s.isOpen ? 'text-mint-600' : 'text-navy-900/30'}`}>
                      <Clock size={11} /> {s.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
