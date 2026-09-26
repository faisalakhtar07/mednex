import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

// NOTE: CartProvider/StoreProvider/WishlistProvider have been removed along
// with the medical-store marketplace (cart, store selection, wishlist).

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

// Register the service worker so the app is installable (Android, desktop
// Chrome/Edge) and works as a standalone app once installed. Safe to run in
// dev too — the worker never caches /api/* (see service-worker.js).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => console.error('Service worker registration failed:', err))
  })
}
