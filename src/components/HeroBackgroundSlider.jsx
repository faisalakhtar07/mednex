import { useEffect, useState } from 'react'

// Paste your own photo URLs here to activate the sliding background — a link
// you own the rights to, or a licensed stock photo (e.g. Unsplash/Pexels,
// which explicitly allow free commercial use). Leave the array empty and
// the hero just uses its plain gradient background instead — no photo ships
// with this app by default (see src/utils/productImage.js for why).
const heroImages = [
  // 'https://your-image-url-1.jpg',
  // 'https://your-image-url-2.jpg',
]

export default function HeroBackgroundSlider() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (heroImages.length < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % heroImages.length), 4000)
    return () => clearInterval(t)
  }, [])

  if (heroImages.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {heroImages.map((url, i) => (
        <div
          key={url}
          style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          className={`absolute inset-0 scale-105 transition-opacity duration-1000 ${i === index ? 'opacity-90' : 'opacity-0'}`}
        />
      ))}
      {/* Light wash only at the top, where the headline text sits — keeps the
          rest of the photo clearly visible instead of washing out the whole thing. */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/20 to-transparent" />
    </div>
  )
}
