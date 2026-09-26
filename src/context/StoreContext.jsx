import { createContext, useContext, useEffect, useState } from 'react'
import { useCart } from './CartContext.jsx'
import { api } from '../utils/api.js'

const StoreContext = createContext(null)
const STORAGE_KEY = 'mednex_selected_store'

// Every customer must pick ONE medical store before they can browse
// medicines (spec section 8) — this holds that choice for the session and
// persists it across reloads. Switching stores mid-cart clears the cart
// rather than silently mixing items from two stores (spec section 8: "cart
// architecture should prevent accidental mixing of products from different
// stores").
//
// If nobody has picked a store yet (first visit, or nothing saved), this
// auto-selects MedNex's own official store as the default — so the catalog
// is never empty just because no third-party store has joined the platform
// yet ("khud ka bhi medical sell karna hai, ek shop pe depend nahi
// rahunga"). Customers can still PIN-search for a different, local store at
// any time; this is only ever the starting point.
export function StoreProvider({ children }) {
  const { items, clearCart } = useCart()
  const [selectedStore, setSelectedStore] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [switchWarning, setSwitchWarning] = useState('') // last switch's cart-clear message, for a one-time toast

  useEffect(() => {
    if (selectedStore) localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStore))
    else localStorage.removeItem(STORAGE_KEY)
  }, [selectedStore])

  useEffect(() => {
    if (selectedStore) return // user (or a previous session) already has a store — never override that
    api.getOfficialStore().then(setSelectedStore).catch(() => {}) // no official store configured yet — fine, PIN search still works
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // store: { id, storeName, city, pinCode, ... } — whatever the store-search/
  // store-page response gives us; only id and storeName are relied on elsewhere.
  const selectStore = (store) => {
    const switchingStore = selectedStore && String(selectedStore.id) !== String(store.id)
    if (switchingStore && items.length > 0) {
      clearCart()
      setSwitchWarning(`Your cart was cleared — it had items from ${selectedStore.storeName}.`)
    }
    setSelectedStore(store)
  }

  const clearSelectedStore = () => setSelectedStore(null)
  const consumeSwitchWarning = () => {
    const w = switchWarning
    setSwitchWarning('')
    return w
  }

  return (
    <StoreContext.Provider value={{ selectedStore, selectStore, clearSelectedStore, consumeSwitchWarning }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
