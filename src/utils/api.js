// Central place that talks to the MedNex backend.
// In local development the backend runs at http://localhost:5000.
// In production, set VITE_API_URL in Vercel's Environment Variables to your
// deployed backend's URL (e.g. https://mednex-backend.onrender.com).
const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

function getToken() {
  return localStorage.getItem('mednex_token')
}

export function setToken(token) {
  if (token) localStorage.setItem('mednex_token', token)
  else localStorage.removeItem('mednex_token')
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (!isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`)
  }
  return data
}

// MongoDB returns `_id`, the rest of the app was written expecting `id`.
// Normalize here once so every page/component can just use `.id` — recurses
// into nested populated sub-documents too (e.g. appointment.doctorId), not
// just the top-level object, since Mongoose populate() nests real docs.
function withId(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(withId)
  if (obj instanceof Date) return obj
  const mapped = {}
  for (const [key, value] of Object.entries(obj)) {
    mapped[key] = value && typeof value === 'object' ? withId(value) : value
  }
  return obj._id ? { ...mapped, id: obj._id } : mapped
}

export const api = {
  // Auth — mobile number + password only (OTP removed entirely).
  forgotPassword: (email) => request('/auth/password/forgot', { method: 'POST', body: { email } }),
  resetPassword: ({ email, token, newPassword }) => request('/auth/password/reset', { method: 'POST', body: { email, token, newPassword } }),
  setPassword: (newPassword, currentPassword) => request('/auth/password', { method: 'PUT', body: { newPassword, currentPassword } }),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: payload }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (mobile, password) => request('/auth/login', { method: 'POST', body: { mobile, password } }),
  me: () => request('/auth/me'),
  addAddress: (payload) => request('/auth/addresses', { method: 'POST', body: payload }),
  getAddresses: () => request('/auth/addresses'),
  updateAddress: (id, payload) => request(`/auth/addresses/${id}`, { method: 'PUT', body: payload }),
  deleteAddress: (id) => request(`/auth/addresses/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id) => request(`/auth/addresses/${id}/default`, { method: 'PUT' }),

  // Doctor / doctor_staff auth — doctor self-registers (no access code,
  // gated by subscription + Super Admin approval instead); doctor_staff
  // accounts are created from the doctor/staff dashboard via staffAdd, not
  // self-service.
  staffLogin: (payload) => request('/staff/login', { method: 'POST', body: payload }),
  staffRegister: (payload) => request('/staff/register', { method: 'POST', body: payload }),
  staffAdd: (payload) => request('/staff/add', { method: 'POST', body: payload }).then(withId),
  myStaff: () => request('/staff/mine').then(withId),
  setStaffActive: (id, active) => request(`/staff/${id}/active`, { method: 'PUT', body: { active } }),

  // Subscription plans + this doctor's subscription
  getPlans: () => request('/subscriptions/plans').then(withId),
  subscribeToPlan: (planId) => request('/subscriptions/mine', { method: 'POST', body: { planId } }).then(withId),
  startFreeTrial: () => request('/subscriptions/start-free-trial', { method: 'POST' }),
  getMySubscriptions: () => request('/subscriptions/mine').then(withId),

  // Notifications
  myNotifications: () => request('/notifications/mine').then((d) => ({ ...d, notifications: withId(d.notifications) })),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Browser push notifications (VAPID) — see utils/push.js for the subscribe flow.
  getVapidPublicKey: () => request('/push/vapid-public-key'),
  subscribePush: (subscription) => request('/push/subscribe', { method: 'POST', body: subscription }),
  unsubscribePush: (endpoint) => request('/push/unsubscribe', { method: 'POST', body: { endpoint } }),

  // Ratings & Reviews
  submitReview: (payload) => request('/reviews', { method: 'POST', body: payload }).then(withId),
  getDoctorReviews: (doctorId, page = 1) => request(`/reviews/doctor/${doctorId}?page=${page}`).then((d) => ({ ...d, reviews: withId(d.reviews) })),

  // Favorite/saved doctors
  myFavoriteDoctors: () => request('/favorites/mine').then(withId),
  toggleFavoriteDoctor: (doctorId) => request(`/favorites/${doctorId}`, { method: 'POST' }),

  // "MedNex Picks" — admin-curated homepage showcase cards (name/price/image)
  getFeatured: () => request('/featured').then(withId),

  // Lab tests
  getLabTests: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/labtests${qs ? `?${qs}` : ''}`).then(withId)
  },
  getLabTest: (id) => request(`/labtests/${id}`).then(withId),
  bookLabTest: (payload) => request('/labbookings', { method: 'POST', body: payload }),
  myLabBookings: () => request('/labbookings/mine').then(withId),

  // Admin
  adminCustomers: () => request('/admin/customers').then(withId),
  adminCustomer: (id) => request(`/admin/customers/${id}`),
  adminStats: () => request('/admin/stats'),

  // Admin: platform settings
  adminGetSettings: () => request('/admin/settings').then(withId),
  adminUpdateSettings: (payload) => request('/admin/settings', { method: 'PUT', body: payload }).then(withId),

  // Admin: doctor verification (replaces the old store verification)
  adminGetDoctors: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/admin/doctors${qs ? `?${qs}` : ''}`).then(withId)
  },
  adminVerifyDoctor: (id, verificationStatus, verificationNote) =>
    request(`/admin/doctors/${id}/verify`, { method: 'PUT', body: { verificationStatus, verificationNote } }).then(withId),
  adminSetDoctorActive: (id, isAvailable) => request(`/admin/doctors/${id}/active`, { method: 'PUT', body: { isAvailable } }).then(withId),

  // Admin: featured items
  adminGetFeatured: () => request('/admin/featured').then(withId),
  adminAddFeatured: (payload) => request('/admin/featured', { method: 'POST', body: payload }).then(withId),
  adminUpdateFeatured: (id, payload) => request(`/admin/featured/${id}`, { method: 'PUT', body: payload }).then(withId),
  adminDeleteFeatured: (id) => request(`/admin/featured/${id}`, { method: 'DELETE' }),

  // Payments (Razorpay test mode) — subscription payments only now
  getRazorpayKey: () => request('/payments/key'),
  createSubscriptionOrder: (subscriptionId) => request('/payments/create-subscription-order', { method: 'POST', body: { subscriptionId } }),
  verifySubscriptionPayment: (payload) => request('/payments/verify-subscription', { method: 'POST', body: payload }),

  // --- Doctor Appointment System ---

  // Public search + profile
  searchDoctors: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/doctors${qs ? `?${qs}` : ''}`).then(withId)
  },
  getDoctor: (id) => request(`/doctors/${id}`).then(withId),
  getQueueToday: (doctorId) => request(`/doctors/queue/${doctorId}/today`),

  // A doctor's own profile
  registerDoctorProfile: (payload) => request('/doctors/register', { method: 'POST', body: payload }).then(withId),
  getMyDoctorProfile: () => request('/doctors/mine/profile').then(withId),
  updateMyDoctorProfile: (payload) => request('/doctors/mine/profile', { method: 'PUT', body: payload }).then(withId),
  uploadDoctorQrCode: (file) => {
    const form = new FormData()
    form.append('file', file)
    return request('/doctors/mine/qr-code', { method: 'PUT', body: form, isForm: true }).then(withId)
  },

  // Patient booking
  bookAppointment: (payload) => request('/appointments', { method: 'POST', body: payload }).then(withId),
  myAppointments: () => request('/appointments/mine').then(withId),
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: 'PUT' }).then(withId),

  // Doctor/staff dashboard — appointment management + live token queue
  dashboardAppointments: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/doctor-dashboard/appointments${qs ? `?${qs}` : ''}`).then(withId)
  },
  confirmAppointment: (id) => request(`/doctor-dashboard/appointments/${id}/confirm`, { method: 'PUT' }).then(withId),
  rejectAppointment: (id, reason) => request(`/doctor-dashboard/appointments/${id}/reject`, { method: 'PUT', body: { reason } }).then(withId),
  completeAppointment: (id) => request(`/doctor-dashboard/appointments/${id}/complete`, { method: 'PUT' }).then(withId),
  markNoShow: (id) => request(`/doctor-dashboard/appointments/${id}/no-show`, { method: 'PUT' }).then(withId),
  dashboardQueueToday: () => request('/doctor-dashboard/queue/today').then((d) => ({ ...d, queue: withId(d.queue) })),
  callNextToken: () => request('/doctor-dashboard/queue/call-next', { method: 'POST' }),
}

export const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
