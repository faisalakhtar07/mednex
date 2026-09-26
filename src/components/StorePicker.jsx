import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search } from 'lucide-react'

// Spec section 3's "Enter your PIN code" search box. Used standalone in the
// Home hero and reused (compact) wherever a page needs a store before it can
// show anything (ProductListing, SearchResults, ProductDetail).
export default function StorePicker({ compact = false }) {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (pin.trim().length !== 6) return
    navigate(`/stores?pin=${pin.trim()}`)
  }

  return (
    <form onSubmit={submit} className={compact ? 'flex gap-2' : 'flex flex-col sm:flex-row gap-2.5 max-w-md'}>
      <div className="relative flex-1">
        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-900/30" />
        <input
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter your PIN code"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="focus-ring w-full border border-navy-900/15 rounded-full pl-10 pr-3.5 py-2.5 text-sm bg-white"
        />
      </div>
      <button
        type="submit"
        disabled={pin.length !== 6}
        className="focus-ring shrink-0 flex items-center justify-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full bg-teal-600 text-white disabled:opacity-40"
      >
        <Search size={15} /> Find Stores
      </button>
    </form>
  )
}
