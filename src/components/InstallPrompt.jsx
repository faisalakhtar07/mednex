import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'

const DISMISS_KEY = 'mednex_install_dismissed_at'
const DISMISS_DAYS = 7

function wasRecentlyDismissed() {
  const at = localStorage.getItem(DISMISS_KEY)
  if (!at) return false
  return Date.now() - Number(at) < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

// Android/desktop Chrome & Edge fire 'beforeinstallprompt' and let us trigger
// the native install dialog. iOS Safari has no such API at all — the only
// way to "install" there is the user manually doing Share -> Add to Home
// Screen, so that path just shows instructions instead of a button.
export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed())

  useEffect(() => {
    if (isStandalone() || dismissed) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredEvent(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    if (isIOS()) setShowIosHint(true)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [dismissed])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }

  const install = async () => {
    if (!deferredEvent) return
    deferredEvent.prompt()
    await deferredEvent.userChoice
    setDeferredEvent(null)
  }

  if (dismissed || isStandalone()) return null
  if (!deferredEvent && !showIosHint) return null

  return (
    <div className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-navy-950 text-white rounded-xl2 shadow-cardHover px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
          <Download size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Install MedNex App</p>
          <p className="text-[11px] text-white/60">
            {deferredEvent ? 'Add to your home screen for faster access' : (
              <>Tap <Share size={11} className="inline -mt-0.5" /> Share, then "Add to Home Screen"</>
            )}
          </p>
        </div>
        {deferredEvent && (
          <button onClick={install} className="focus-ring shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-600">
            Install
          </button>
        )}
        <button onClick={dismiss} aria-label="Dismiss" className="focus-ring shrink-0 text-white/50 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
