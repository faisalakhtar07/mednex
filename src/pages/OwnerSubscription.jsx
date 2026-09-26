import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { ChevronLeft, CheckCircle2, Crown } from 'lucide-react'
import Button from '../components/Button.jsx'
import { api } from '../utils/api.js'
import { loadRazorpayScript } from '../utils/razorpay.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

// Lets a store owner pick a plan and pay for it via real Razorpay checkout.
// Plans are entirely database-driven (spec section 4) — nothing here is
// hardcoded to "Basic/Professional/Premium"; whatever Super Admin has
// configured shows up. A subscription only ever activates after the backend
// independently verifies the Razorpay payment signature — see
// POST /api/payments/verify-subscription — never from anything the client
// merely claims happened.
export default function OwnerSubscription() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [store, setStore] = useState(null)
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyPlanId, setBusyPlanId] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (user?.role !== 'owner') return
    Promise.all([api.getMyStore(), api.getPlans(), api.getMySubscriptions()])
      .then(([s, p, subs]) => {
        setStore(s)
        setPlans(p)
        setSubscriptions(subs)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [user])

  if (!authLoading && !isAuthenticated) return <Navigate to="/staff/login" replace />
  if (!authLoading && user && user.role !== 'owner') return <Navigate to="/" replace />
  if (!loading && notFound) return <Navigate to="/owner/store/register" replace />
  if (authLoading || loading) return <div className="max-w-lg mx-auto px-5 py-16 text-center text-sm text-navy-900/40">Loading plans...</div>

  const choosePlan = async (planId) => {
    setBusyPlanId(planId)
    try {
      const { keyId, configured } = await api.getRazorpayKey()
      if (configured === false) {
        showToast('Online payments are not set up on the server yet — contact MedNex support.')
        setBusyPlanId(null)
        return
      }

      const subscription = await api.subscribeToPlan(planId)
      const { razorpayOrderId, amount, currency, planName, storeName, ownerPhone } = await api.createSubscriptionOrder(subscription.id)

      const scriptOk = await loadRazorpayScript()
      if (!scriptOk) {
        showToast('Could not load the payment gateway. Check your internet connection.')
        setBusyPlanId(null)
        return
      }

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'MedNex',
        description: `${planName} subscription — ${storeName}`,
        order_id: razorpayOrderId,
        prefill: { name: storeName, contact: ownerPhone },
        theme: { color: '#0E9C90' },
        handler: async (response) => {
          try {
            const result = await api.verifySubscriptionPayment({
              subscriptionId: subscription.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setStore(result.store)
            showToast('Payment successful — your store is now visible in marketplace search')
            const subs = await api.getMySubscriptions()
            setSubscriptions(subs)
          } catch (err) {
            showToast(err.message || 'Payment verification failed')
          } finally {
            setBusyPlanId(null)
          }
        },
        modal: { ondismiss: () => setBusyPlanId(null) },
      })
      rzp.on('payment.failed', () => {
        showToast('Payment failed — please try again')
        setBusyPlanId(null)
      })
      rzp.open()
    } catch (err) {
      showToast(err.message || 'Could not start subscription payment')
      setBusyPlanId(null)
    }
  }

  const isCurrentPlan = (planId) => store?.activeSubscriptionId && subscriptions.some((s) => s.id === store.activeSubscriptionId && s.planId?.id === planId)

  return (
    <div className="max-w-2xl mx-auto px-5 lg:px-6 py-6 md:py-10">
      <Link to="/owner/store" className="focus-ring inline-flex items-center gap-1 text-xs text-navy-900/50 mb-4">
        <ChevronLeft size={14} /> Back to store profile
      </Link>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-display font-bold mb-1">Choose a Subscription Plan</h1>
        <p className="text-sm text-navy-900/50">
          {store?.subscriptionStatus === 'active'
            ? "You're subscribed. Choosing a different plan below switches you to it immediately."
            : 'Your store stays hidden from customer search until a subscription is active.'}
        </p>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-navy-900/40 py-10 text-center">No plans are available right now — check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const current = isCurrentPlan(plan.id)
            return (
              <div key={plan.id} className={`rounded-xl2 border p-5 flex flex-col ${current ? 'border-teal-600 shadow-card' : 'border-navy-900/10'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Crown size={16} className="text-teal-700" />
                  <h2 className="font-display font-bold">{plan.name}</h2>
                  {current && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-mint-500/10 text-mint-600">Current</span>}
                </div>
                <p className="text-xs text-navy-900/50 mb-3">{plan.description}</p>
                <p className="text-2xl font-bold mb-1">₹{plan.price}<span className="text-xs font-medium text-navy-900/40"> / {plan.durationDays} days</span></p>
                <ul className="space-y-1.5 my-3 flex-1">
                  {(plan.features || []).map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-navy-900/60">
                      <CheckCircle2 size={13} className="text-teal-600 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant={current ? 'secondary' : 'primary'} className="w-full" disabled={busyPlanId === plan.id || current} onClick={() => choosePlan(plan.id)}>
                  {busyPlanId === plan.id ? 'Activating...' : current ? 'Active' : 'Choose Plan'}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
