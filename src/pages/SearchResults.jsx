import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import StorePicker from '../components/StorePicker.jsx'
import { ProductGridSkeleton } from '../components/Skeleton.jsx'
import { api } from '../utils/api.js'
import { useStore } from '../context/StoreContext.jsx'

export default function SearchResults() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const { selectedStore } = useStore()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!q || !selectedStore) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    api.getProducts({ q, storeId: selectedStore.id }).then(setResults).finally(() => setLoading(false))
  }, [q, selectedStore])

  if (!selectedStore) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        <div className="text-5xl mb-4">🏪</div>
        <h3 className="text-base font-semibold mb-1.5">Pick a store first</h3>
        <p className="text-sm text-navy-900/50 mb-5">Enter your PIN code to find medical stores near you, then search their medicines.</p>
        <div className="flex justify-center"><StorePicker /></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <h1 className="text-lg md:text-xl font-display font-bold mb-1">Results for "{q}" at {selectedStore.storeName}</h1>
      <p className="text-xs text-navy-900/40 mb-6">{results.length} products found</p>

      {loading ? (
        <ProductGridSkeleton />
      ) : results.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No products found"
          message="We couldn't find a match at this store. Try a different search term or browse by category."
          ctaLabel="Browse Medicines"
          ctaTo="/medicines"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
