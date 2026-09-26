import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, FlaskConical, Stethoscope, CalendarClock, ArrowRight, ShieldCheck, Clock, BadgeCheck, Sparkles } from 'lucide-react'
import Button from '../components/Button.jsx'
import HeroBackgroundSlider from '../components/HeroBackgroundSlider.jsx'

// NOTE: this page used to load per-store product categories and MedNex
// Picks (admin-curated products) — removed along with the medical-store
// marketplace. It now centers on doctor search, which will call the real
// backend once the Doctor Appointment System's search endpoint exists (see
// utils/api.js) — for now the search box just navigates to "/", the same
// placeholder every other doctor link uses until that route is built.

const quickActions = [
  { icon: Stethoscope, title: 'Find a Doctor', desc: 'Search doctors by specialization near you.', to: '/doctors', color: 'bg-navy-900/5 text-navy-900' },
  { icon: CalendarClock, title: 'My Appointments', desc: 'Track your upcoming and past bookings.', to: '/appointments', color: 'bg-teal-50 text-teal-700' },
  { icon: FlaskConical, title: 'Lab Tests', desc: 'Book diagnostic tests from home.', to: '/lab-tests', color: 'bg-mint-500/10 text-mint-600' },
]

const trust = [
  { icon: ShieldCheck, label: 'Verified Doctors' },
  { icon: Clock, label: 'Live Token Queue' },
  { icon: BadgeCheck, label: 'Genuine Appointments Only' },
]

export default function Home() {
  const [query, setQuery] = useState('')

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 to-white">
        <HeroBackgroundSlider />
        <div className="relative max-w-3xl mx-auto px-5 lg:px-6 pt-10 pb-12 md:pt-16 md:pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-100 px-3 py-1 rounded-full mb-4">Healthcare Made Simple.</span>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold leading-tight text-navy-900 mb-4">
              Book a Doctor,<br /> Skip the Wait.
            </h1>
            <p className="text-sm md:text-base text-navy-900/60 max-w-md mx-auto mb-7">
              Find verified doctors near you, book an appointment, and track your live token queue — no more sitting in a crowded waiting room.
            </p>

            <div className="mb-8 flex flex-col items-center">
              <div className="relative w-full max-w-md">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-900/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search doctors by name or specialization"
                  className="focus-ring w-full pl-11 pr-4 py-3 rounded-full bg-white border border-teal-100 shadow-card text-sm placeholder:text-navy-900/40"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Button as={Link} to="/doctors" size="lg">Find a Doctor</Button>
              <Button as={Link} to="/lab-tests" size="lg" variant="outline">Book Lab Test</Button>
            </div>
            <div className="flex flex-wrap justify-center gap-5">
              {trust.map((t) => (
                <div key={t.label} className="flex items-center gap-1.5 text-xs font-medium text-navy-900/60">
                  <t.icon size={15} className="text-teal-600" /> {t.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="max-w-7xl mx-auto px-5 lg:px-6 -mt-2 md:mt-0 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 md:gap-4">
          {quickActions.map((a, i) => (
            <motion.div key={a.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={a.to} className="focus-ring group block bg-white rounded-xl2 border border-navy-900/5 shadow-card hover:shadow-cardHover p-4 h-full transition-shadow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${a.color}`}>
                  <a.icon size={19} />
                </div>
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-1">
                  {a.title}
                  <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-navy-900/50 leading-relaxed">{a.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 lg:px-6 py-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-teal-600" />
            <h2 className="text-lg font-display font-bold">Popular Specializations</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['General Physician', 'Dermatologist', 'Pediatrician', 'Cardiologist', 'Dentist', 'Gynecologist', 'Psychiatrist', 'Orthopedic'].map((s) => (
            <Link key={s} to={`/doctors?specialization=${encodeURIComponent(s)}`} className="focus-ring bg-white rounded-xl2 border border-navy-900/5 shadow-card hover:shadow-cardHover p-4 text-center transition-shadow">
              <p className="text-sm font-semibold">{s}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Banner */}
      <section className="max-w-7xl mx-auto px-5 lg:px-6 pb-14">
        <div className="rounded-xl2 bg-navy-950 text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10 max-w-md">
            <h3 className="text-2xl font-display font-bold mb-2">Are you a doctor?</h3>
            <p className="text-sm text-white/60 mb-5">Join MedNex and reach patients near you — manage your appointments and staff from one dashboard.</p>
            <Button as={Link} to="/staff/register" variant="primary">Register as a Doctor</Button>
          </div>
          <div className="text-7xl relative z-10">🧑‍⚕️</div>
        </div>
      </section>
    </div>
  )
}
