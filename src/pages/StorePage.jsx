import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { MapPin, Star, Clock, ArrowLeft, Search } from 'lucide-react'
import ProductCard from '../components/ProductCard.jsx'
import { ProductGridSkeleton } from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { categories } from '../data/categories.js'
import { api } from '../utils/api.js'
import { useStore } from '../context/StoreContext.jsx'

// The "Store Page" from spec section 8's customer flow — everything past
// this point (browse -> cart -> checkout) is scoped to this one store.
export default function StorePage() {
  const { id } = useParams()
  const { selectedStore, selectStore } = useStore()
  const [store, setStore] = useState(selectedStore?.id === id ? selectedStore : null)
  const [storeError, setStoreError] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    api
      .getStore(id)
      .then((s) => { setStore(s); selectStore(s) })
      .catch(() => setStoreError(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!store) return
    setLoading(true)
    const params = { storeId: store.id }
    if (category) params.category = category
    if (q) params.q = q
    api.getProducts(params).then(setProducts).finally(() => setLoading(false))
  }, [store, category, q])

  if (storeError) return <Navigate to="/stores" replace />
  if (!store) return <div className="max-w-6xl mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading store...</div>

  return (
    <div>
      {/* Store header */}
      <div className="bg-gradient-to-b from-teal-50 to-white border-b border-navy-900/5">
        <div className="max-w-6xl mx-auto px-5 lg:px-6 py-6">
          <Link to="/stores" className="focus-ring inline-flex items-center gap-1 text-xs font-semibold text-navy-900/50 mb-3">
            <ArrowLeft size={13} /> Change store
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl2 bg-white shadow-card flex items-center justify-center text-3xl shrink-0 overflow-hidden">
              {store.logo ? <img src={store.logo} alt="" className="w-full h-full object-cover" /> : '🏪'}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-display font-bold truncate">{store.storeName}</h1>
              <p className="flex items-center gap-1 text-xs text-navy-900/50 mt-0.5">
                <MapPin size={12} /> {store.address ? `${store.address}, ` : ''}{store.city}, {store.state} - {store.pinCode}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                {store.ratingAvg > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
                    <Star size={11} className="fill-amber-500 text-amber-500" /> {store.ratingAvg.toFixed(1)}
                  </span>
                )}
                <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${store.isOpen ? 'text-mint-600' : 'text-coral'}`}>
                  <Clock size={11} /> {store.isOpen ? `Open · ${store.openingTime}-${store.closingTime}` : 'Closed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 lg:px-6 py-6">
        {/* Search within store */}
        <div className="relative max-w-sm mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-900/30" />
          <input
            placeholder={`Search medicines at ${store.storeName}`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="focus-ring w-full border border-navy-900/15 rounded-full pl-10 pr-3.5 py-2.5 text-sm"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-4 mb-2">
          <button
            onClick={() => setCategory('')}
            className={`focus-ring shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border ${!category ? 'bg-navy-950 text-white border-navy-950' : 'border-navy-900/15 text-navy-900/60'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`focus-ring shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border ${category === c.slug ? 'bg-navy-950 text-white border-navy-950' : 'border-navy-900/15 text-navy-900/60'}`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <ProductGridSkeleton />
        ) : products.length === 0 ? (
          <EmptyState icon="💊" title="No medicines found" message="Try a different category or search term." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
