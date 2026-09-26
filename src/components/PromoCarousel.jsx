import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Site-wide auto-sliding banner strip, positioned just above the footer on
// every page. Each slide can use a real photo via `image` (paste your own
// URL — a link you own the rights to, or a licensed stock photo). Leave
// `image` empty/undefined and it falls back to the CSS gradient instead —
// no photo ships with this app by default (see src/utils/productImage.js
// for why), so nothing renders until you add your own URLs below.
const slides = [
  { id: 1, title: 'Verified Doctors, Trusted Care', subtitle: 'Every doctor on MedNex is verified before they go live', gradient: 'from-teal-600 to-teal-800', image: '' },
  { id: 2, title: 'Consult Doctors Online', subtitle: 'Qualified doctors available for appointment booking, any time', gradient: 'from-coral to-rose-600', image: '' },
  { id: 3, title: 'Book Your Slot, Skip the Wait', subtitle: 'Live token queue updates so you know exactly when it\'s your turn', gradient: 'from-mint-500 to-teal-700', image: '' },
  { id: 4, title: 'Doctors, All Across India', subtitle: 'Find a nearby doctor by specialization and book instantly', gradient: 'from-amber-500 to-orange-600', image: '' },
]

export default function PromoCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000)
    return () => clearInterval(t)
  }, [])

  const go = (dir) => setIndex((i) => (i + dir + slides.length) % slides.length)

  return (
    <section className="max-w-7xl mx-auto px-5 lg:px-6 pb-10">
      <div className="relative rounded-xl2 overflow-hidden h-40 md:h-48">
        {slides.map((s, i) => (
          <div
            key={s.id}
            style={s.image ? { backgroundImage: `url(${s.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            className={`absolute inset-0 ${s.image ? '' : `bg-gradient-to-br ${s.gradient}`} flex flex-col items-center justify-center text-center px-6 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {/* Dark overlay so title/subtitle stay readable over any photo — harmless no-op over a plain gradient. */}
            {s.image && <div className="absolute inset-0 bg-navy-950/40" />}
            <h3 className="relative text-white text-lg md:text-2xl font-display font-bold mb-1.5">{s.title}</h3>
            <p className="relative text-white/75 text-xs md:text-sm max-w-md">{s.subtitle}</p>
          </div>
        ))}

        <button
          onClick={() => go(-1)}
          aria-label="Previous"
          className="focus-ring absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next"
          className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
        >
          <ChevronRight size={16} />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`focus-ring w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
